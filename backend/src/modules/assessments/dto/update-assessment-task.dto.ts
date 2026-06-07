import { PartialType } from '@nestjs/swagger';
import { CreateAssessmentTaskDto } from './create-assessment-task.dto';

export class UpdateAssessmentTaskDto extends PartialType(CreateAssessmentTaskDto) {}
