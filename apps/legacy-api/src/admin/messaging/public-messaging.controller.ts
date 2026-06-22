import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminMessagingService } from './messaging.service';

@Controller('messaging')
@ApiTags('Messaging')
export class PublicMessagingController {
  constructor(private readonly messagingService: AdminMessagingService) {}

  @Get('active-alert')
  getActiveAlert() {
    return this.messagingService.getActiveAlert();
  }
}
