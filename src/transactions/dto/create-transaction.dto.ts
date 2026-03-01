import { IsString, IsEmail, IsNumber, IsInt, IsPositive, Min, IsOptional } from 'class-validator';

export class CreateTransactionDto {
  @IsString()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsEmail()
  customerEmail: string;

  @IsString()
  customerFullName: string;

  @IsString()
  customerPhone: string;

  @IsNumber()
  amount: number; 
  
   @IsString()
  address: string;

  @IsString()
  city: string;
}