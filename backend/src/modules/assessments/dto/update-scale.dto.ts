import { PartialType } from '@nestjs/swagger';
import { CreateScaleDto } from './create-scale.dto';

export class UpdateScaleDto extends PartialType(CreateScaleDto) {}
