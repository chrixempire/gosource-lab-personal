import { IsNotEmpty } from 'class-validator';

export class NewWalletDto {
  @IsNotEmpty()
  bvn: string;

  @IsNotEmpty()
  otp: string;
}

export class VerifyBvnDto {
  @IsNotEmpty()
  bvn: string;
}

export class FundWalletDto {
  @IsNotEmpty()
  transactionReference: string;

  @IsNotEmpty()
  amount: number;
}
