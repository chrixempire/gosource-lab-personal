import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from './product.service';
import { getModelToken } from '@nestjs/mongoose';
import { Product } from './entities/product.entity';
import { Category } from '../category/entities/category.entity';

describe('ProductService - XML Feed', () => {
  let service: ProductService;
  let mockProductModel: any;
  let mockCategoryModel: any;

  beforeEach(async () => {
    // Mock product model
    mockProductModel = {
      find: jest.fn(),
      findById: jest.fn(),
    };

    // Mock category model
    mockCategoryModel = {
      aggregate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: getModelToken(Product.name),
          useValue: mockProductModel,
        },
        {
          provide: getModelToken(Category.name),
          useValue: mockCategoryModel,
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
  });

  it('should generate XML product feed', async () => {
    // Mock product data
    const mockProducts = [
      {
        _id: '507f1f77bcf86cd799439011',
        name: 'Test Product',
        description: 'Test Description',
        actualPrice: 100,
        discountPrice: 90,
        brand: 'Test Brand',
        slug: 'test-product',
        inStock: true,
        quantity: 10,
        trackQuantity: true,
        active: true,
        images: [{ url: 'https://example.com/image.jpg' }],
        category: { name: 'Test Category' },
      },
    ];

    // Mock the populate chain
    const mockQuery = {
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(mockProducts),
    };

    mockProductModel.find.mockReturnValue(mockQuery);

    const xml = await service.generateProductFeed();

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8" ?>');
    expect(xml).toContain('<products>');
    expect(xml).toContain('<product>');
    expect(xml).toContain('<id>507f1f77bcf86cd799439011</id>');
    expect(xml).toContain('<title>Test Product</title>');
    expect(xml).toContain('<price>100.00 KES</price>');
    expect(xml).toContain('<sale_price>90.00 KES</sale_price>');
    expect(xml).toContain('<brand>Test Brand</brand>');
    expect(xml).toContain('<availability>in stock</availability>');
    expect(xml).toContain('</products>');
  });

  it('should handle products without sale price', async () => {
    const mockProducts = [
      {
        _id: '507f1f77bcf86cd799439012',
        name: 'Regular Price Product',
        description: 'No discount',
        actualPrice: 150,
        discountPrice: null,
        brand: 'Test Brand',
        slug: 'regular-product',
        inStock: true,
        quantity: 5,
        trackQuantity: true,
        active: true,
        images: [],
        category: 'Electronics',
      },
    ];

    const mockQuery = {
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(mockProducts),
    };

    mockProductModel.find.mockReturnValue(mockQuery);

    const xml = await service.generateProductFeed();

    expect(xml).toContain('<price>150.00 KES</price>');
    expect(xml).not.toContain('<sale_price>');
  });
});
