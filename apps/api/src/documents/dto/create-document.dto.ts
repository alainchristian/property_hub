import { IsEnum, IsNotEmpty, IsNumber, IsString, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DocumentRefType } from '../document.entity';

export class CreateDocumentDto {
  @ApiProperty({ enum: DocumentRefType })
  @IsEnum(DocumentRefType)
  refType: DocumentRefType;

  @ApiProperty()
  @IsUUID()
  refId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  filePath: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  fileSize: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @ApiProperty()
  @IsUUID()
  uploadedBy: string;
}
