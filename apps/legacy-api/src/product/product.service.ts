import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './entities/product.entity';
import { QueryParamsDto } from '../analytics/dto/query-param.dto';
import { escapeRegex } from '../utils/helpers';
import { Category } from '../category/entities/category.entity';
import { ProductFeedItem, ProductFeedOptions } from './dto/product-feed.dto';
import { Branch } from '../branch/entities/branch.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(Branch.name) private branchModel: Model<Branch>,
  ) {}

  /**
   * Get all products.
   *
   * @returns
   */
  async findAll(): Promise<any> {
    const products: Product[] = await this.productModel.find();
    return {
      status: true,
      message: 'Products fetched successfully',
      data: products,
    };
  }

  /**
   * Get single product.
   *
   * @param id
   * @returns
   */
  async findOne(id: string): Promise<any> {
    const product: ProductDocument = await this.productModel.findById(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return {
      status: true,
      message: 'Product fetched successfully',
      data: product,
    };
  }

  async getRecentOrders(branchId: string) {
    const branch = await this.branchModel
      .findById(branchId)
      .populate('recentOrderProducts');

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    return {
      status: true,
      message: 'Recent order products fetched successfully',
      data: branch.recentOrderProducts || [],
    };
  }

  /**
   * Search products.
   *
   * @param query
   * @returns {object}
   */
  async searchProducts(query: QueryParamsDto): Promise<any> {
    const { limit = 10, page = 1, name, brand, category } = query;
    const filter: any = [];

    if (name) {
      filter.push({
        $regexMatch: {
          input: '$name',
          regex: escapeRegex(name),
          options: 'i',
        },
      });
    }

    if (brand) {
      filter.push({
        $regexMatch: {
          input: '$brand',
          regex: escapeRegex(brand),
          options: 'i',
        },
      });
    }

    if (category) {
      filter.push({
        $or: [
          { $eq: ['$category', category] },
          { $eq: ['$category', '$$categoryName'] },
        ],
      });
    }

    const products = await this.categoryModel.aggregate([
      {
        $lookup: {
          from: 'products',
          let: { categoryId: '$_id', categoryName: '$name' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $or: [
                        { $eq: ['$category', '$$categoryId'] },
                        { $eq: ['$category', '$$categoryName'] },
                      ],
                    },
                    {
                      $or: [
                        { $eq: ['$active', true] },
                        { $eq: [{ $type: '$active' }, 'missing'] },
                      ],
                    },
                    ...filter,
                  ],
                },
              },
            },
            {
              $skip: (page - 1) * limit,
            },
            {
              $limit: limit,
            },
          ],
          as: 'products',
        },
      },
      {
        $addFields: {
          productCount: { $size: '$products' },
        },
      },
      {
        $match: {
          productCount: { $gt: 0 },
        },
      },
    ]);

    return {
      status: true,
      message: 'Products fetched successfully',
      data: products,
      meta: {
        page,
        limit,
      },
    };
  }

  /**
   * Generate XML product feed for Google Shopping or other platforms
   *
   * @param options ProductFeedOptions
   * @returns XML string
   */
  async generateProductFeed(options: ProductFeedOptions = {}): Promise<string> {
    try {
      const {
        baseUrl = 'https://dashboard.gosource.app/market',
        currency = 'NGN',
        defaultGoogleCategory = '500',
      } = options;

      // Fetch all active products or those where 'active' is not defined, and populate category if it's an ObjectId
      const products: ProductDocument[] = await this.productModel
        .find({
          $and: [
            {
              $or: [{ active: { $eq: true } }, { active: { $exists: false } }],
            },
            // Only include documents where category is either null, doesn't exist, or is an ObjectId
            {
              $or: [
                { category: { $exists: false } },
                { category: null },
                { category: { $type: 'objectId' } },
              ],
            },
          ],
        })
        .populate({
          path: 'category',
          model: Category.name,
        })
        .exec();

      // For products where category is a string, leave as is
      // For products where category is an object, it will be populated

      // Generate XML header
      let xml = '<?xml version="1.0" encoding="UTF-8" ?>\n<products>\n\n';

      // Process each product
      for (const product of products) {
        const productFeedItem = this.transformProductToFeedItem(
          product,
          baseUrl,
          currency,
          defaultGoogleCategory,
        );
        xml += this.generateProductXML(productFeedItem);
      }

      // Close XML
      xml += '</products>';

      return xml;
    } catch (error) {
      console.error('Error generating product feed:', error);
      throw new Error('Failed to generate product feed');
    }
  }

  /**
   * Transform a product document to a product feed item
   *
   * @param product ProductDocument
   * @param baseUrl string
   * @param currency string
   * @param defaultGoogleCategory string
   * @returns ProductFeedItem
   */
  private transformProductToFeedItem(
    product: ProductDocument,
    baseUrl: string,
    currency: string,
    defaultGoogleCategory: string,
  ): ProductFeedItem {
    const productSlug = `${generateSlug(product?.name)}-${product._id}`;
    const trackUrl = `${baseUrl}?product=${productSlug}`;
    const categoryName =
      typeof product.category === 'object'
        ? product.category.name
        : product.category || 'General';

    // Get primary image
    const primaryImage =
      product.images && product.images.length > 0
        ? product.images[0].url || product.images[0]
        : null;

    // Construct image URL
    const imageUrl = primaryImage
      ? primaryImage.startsWith('http')
        ? primaryImage
        : `${baseUrl}/images/products/${primaryImage}`
      : `${baseUrl}/images/products/default-product.jpg`;

    // Calculate availability
    const availability =
      product.inStock && (product.quantity > 0 || !product.trackQuantity)
        ? 'in stock'
        : 'out of stock';

    // Format prices
    const price = product.actualPrice || product.totalPrice || 0;
    const salePrice =
      product.discountPrice && product.discountPrice < price
        ? product.discountPrice
        : null;

    return {
      id: product._id.toString(),
      title: product.name,
      description:
        product.description ||
        `${product.name} - ${product.brand || 'GoSource'}`,
      link: trackUrl,
      image_link: imageUrl,
      availability,
      condition: 'new',
      price: `${price.toFixed(2)} ${currency}`,
      sale_price: salePrice ? `${salePrice.toFixed(2)} ${currency}` : undefined,
      brand: product.brand || 'GoSource',
      product_type: categoryName,
      google_product_category: defaultGoogleCategory,
    };
  }

  /**
   * Generate XML for a single product
   *
   * @param item ProductFeedItem
   * @returns string
   */
  private generateProductXML(item: ProductFeedItem): string {
    let xml = '  <product>\n';
    xml += `    <id>${this.escapeXml(item.id)}</id>\n`;
    xml += `    <title>${this.escapeXml(item.title)}</title>\n`;
    xml += `    <description>${this.escapeXml(item.description)}</description>\n`;
    xml += `    <link>${this.escapeXml(item.link)}</link>\n`;
    xml += `    <image_link>${this.escapeXml(item.image_link)}</image_link>\n`;
    xml += `    <availability>${item.availability}</availability>\n`;
    xml += `    <condition>${item.condition}</condition>\n`;
    xml += `    <price>${item.price}</price>\n`;

    if (item.sale_price) {
      xml += `    <sale_price>${item.sale_price}</sale_price>\n`;
    }

    xml += `    <brand>${this.escapeXml(item.brand)}</brand>\n`;
    xml += `    <product_type>${this.escapeXml(item.product_type)}</product_type>\n`;

    if (item.google_product_category) {
      xml += `    <google_product_category>${item.google_product_category}</google_product_category>\n`;
    }

    xml += '  </product>\n\n';

    return xml;
  }

  /**
   * Escape XML special characters
   *
   * @param text string
   * @returns string
   */
  private escapeXml(text: string): string {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Generate Google Shopping Feed in RSS 2.0 format
   *
   * @param options ProductFeedOptions
   * @returns string
   */
  async generateGoogleShoppingFeed(
    options: ProductFeedOptions = {},
  ): Promise<string> {
    try {
      const {
        baseUrl = 'https://dashboard.gosource.app/market',
        currency = 'NGN',
        storeName = 'GoSource',
        storeDescription = 'Google Shopping Feed for GoSource',
      } = options;

      // Fetch all active products with their categories
      const products: ProductDocument[] = await this.productModel
        .find({
          $and: [
            {
              $or: [{ active: { $eq: true } }, { active: { $exists: false } }],
            },
            {
              $or: [
                { category: { $exists: false } },
                { category: null },
                { category: { $type: 'objectId' } },
              ],
            },
          ],
        })
        .populate({
          path: 'category',
          model: Category.name,
        })
        .exec();

      // Generate RSS header
      let rss = '<?xml version="1.0" encoding="UTF-8" ?>\n';
      rss += '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n';
      rss += '  <channel>\n';
      rss += `    <title>${this.escapeXml(storeName)}</title>\n`;
      rss += `    <link>${this.escapeXml(baseUrl)}</link>\n`;
      rss += `    <description>${this.escapeXml(storeDescription)}</description>\n\n`;

      // Process each product
      for (const product of products) {
        const productSlug = `${generateSlug(product?.name)}-${product._id}`;
        const category =
          typeof product.category === 'object'
            ? product.category?.name
            : product.category;
        const categoryPath = this.buildGoogleCategoryPath(category);

        // Get primary image
        const primaryImage =
          product.images && product.images.length > 0
            ? product.images[0].url || product.images[0]
            : null;

        // Construct image URL
        const imageUrl = primaryImage
          ? primaryImage.startsWith('http')
            ? primaryImage
            : `${baseUrl}/images/products/${primaryImage}`
          : `${baseUrl}/images/products/default-product.jpg`;

        const price = product.actualPrice || product.totalPrice || 0;
        const salePrice =
          product.discountPrice && product.discountPrice < price
            ? product.discountPrice
            : null;

        rss += '    <item>\n';
        rss += `      <g:id>${this.escapeXml(product._id.toString())}</g:id>\n`;
        rss += `      <g:title>${this.escapeXml(product.name)}</g:title>\n`;
        rss += `      <g:description>${this.escapeXml(product.description || '')}</g:description>\n`;
        rss += `      <g:link>${this.escapeXml(`${baseUrl}?product=${productSlug}`)}</g:link>\n`;
        rss += `      <g:image_link>${this.escapeXml(imageUrl)}</g:image_link>\n`;
        rss += `      <g:availability>${product.quantity > 0 ? 'in stock' : 'out of stock'}</g:availability>\n`;
        rss += '      <g:condition>new</g:condition>\n';
        rss += `      <g:price>${price.toFixed(2)} ${currency}</g:price>\n`;

        if (salePrice) {
          rss += `      <g:sale_price>${salePrice.toFixed(2)} ${currency}</g:sale_price>\n`;
        }

        rss += `      <g:brand>${this.escapeXml(product.brand || 'GoSource')}</g:brand>\n`;
        rss += `      <g:product_type>${this.escapeXml(categoryPath)}</g:product_type>\n`;

        // Map your categories to Google's taxonomy
        const googleCategory = this.mapToGoogleCategory(category);
        rss += `      <g:google_product_category>${googleCategory}</g:google_product_category>\n`;
        rss += '    </item>\n\n';
      }

      // Close RSS
      rss += '  </channel>\n';
      rss += '</rss>';

      return rss;
    } catch (error) {
      console.error('Error generating Google Shopping feed:', error);
      throw new Error('Failed to generate Google Shopping feed');
    }
  }

  /**
   * Build a hierarchical category path for Google Shopping
   *
   * @param category string
   * @returns string
   */
  private buildGoogleCategoryPath(category: string): string {
    // Map your store categories to Google's category hierarchy
    const categoryMap: { [key: string]: string } = {
      'Spices and condiments': 'Food & Beverages > Seasonings & Spices',
      'Dairy and eggs': 'Food & Beverages > Dairy Products',
      'Frozen foods': 'Food & Beverages > Frozen Food',
      'Food packaging and disposables':
        'Home & Garden > Kitchen & Dining > Food Storage',
      'Paperware and cleaning': 'Home & Garden > Household Supplies',
      Stationery: 'Office Supplies > General Office Supplies',
      // Add more mappings as needed
    };

    return categoryMap[category] || 'General';
  }

  /**
   * Map store categories to Google Shopping taxonomy IDs
   * Reference: https://www.google.com/basepages/producttype/taxonomy.en-US.txt
   *
   * @param category string
   * @returns string
   */
  private mapToGoogleCategory(category: string): string {
    // Map your categories to Google's official taxonomy IDs
    const categoryMap: { [key: string]: string } = {
      'Spices and condiments': '422', // Food Items > Seasonings & Spices
      'Dairy and eggs': '427', // Food, Beverages & Tobacco > Food Items > Dairy Products
      'Frozen foods': '425', // Food Items > Frozen Foods
      'Food packaging and disposables': '437', // Food Storage
      'Paperware and cleaning': '636', // Household Supplies
      Stationery: '958', // Office Supplies
      // Add more mappings as needed
    };

    return categoryMap[category] || '500'; // 500 is a generic category
  }

  // async updatePrices(customerId: string): Promise<any> {
  //   try {
  //     // Fetch all products
  //     const products: ProductDocument[] = await this.productModel.find();

  //     products.forEach(async (product) => {
  //       const discountedPrice = product.actualPrice;

  //       // Find if the specialPrices array contains an entry for the customerId
  //       const specialPriceEntry = product.specialPrices.find(
  //         (specialPrice) =>
  //           specialPrice.customerId.toString() === customerId.toString(),
  //       );

  //       if (specialPriceEntry) {
  //         // Update the price for the existing specialPrice entry
  //         specialPriceEntry.price = Math.round(discountedPrice * 1.1);
  //       } else {
  //         // If no entry exists for the customerId, create a new one
  //         product.specialPrices.push({
  //           price: Math.round(discountedPrice * 1.1),
  //           businessName: 'Food Court',
  //           customerId: customerId,
  //           email: 'adamsonife@getfoodcourt.com',
  //         });
  //       }

  //       await this.productModel.updateOne(
  //         { _id: product._id },
  //         { $set: { specialPrices: product.specialPrices } },
  //       );
  //     });

  //     return {
  //       message: 'Update successful',
  //     };
  //   } catch (error) {
  //     console.error('Error updating products:', error);
  //   }
  // }
}
function generateSlug(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}
