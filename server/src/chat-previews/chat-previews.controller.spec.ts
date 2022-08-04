import { Test, TestingModule } from '@nestjs/testing';
import { ChatPreviewsController } from './chat-previews.controller';

describe('ChatPreviewsController', () => {
    let controller: ChatPreviewsController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ChatPreviewsController],
        }).compile();

        controller = module.get<ChatPreviewsController>(ChatPreviewsController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
