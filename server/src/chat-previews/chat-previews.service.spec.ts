import { Test, TestingModule } from '@nestjs/testing';
import { ChatPreviewsService } from './chat-previews.service';

describe('ChatPreviewsService', () => {
    let service: ChatPreviewsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ChatPreviewsService],
        }).compile();

        service = module.get<ChatPreviewsService>(ChatPreviewsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
