import { IsString, IsEmail, IsNumber, IsInt, IsPositive, Min } from 'class-validator';

export class CreateTransactionDto {
  @IsString()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  // Customer
  @IsEmail()
  customerEmail: string;

  @IsString()
  customerFullName: string;

  @IsString()
  customerPhone: string;

  // Payment minimal: card number format (fake but structured)
  @IsString()
  cardNumber: string;

  @IsString()
  cardExpMonth: string;

  @IsString()
  cardExpYear: string;

  @IsString()
  cardCvv: string;

  @IsNumber()
  amount: number; // total in decimal (COP)
}