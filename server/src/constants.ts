import { ConfigService } from '@nestjs/config';

const configService = new ConfigService();

export const PORT = configService.get('PORT');
export const IS_PROD = configService.get('STAGE') == 'prod';
export const BASE_URL = IS_PROD ? 'https://floyds-messenger-server.herokuapp.com/' : 'http://localhost:' + PORT;

export const ADMIN_PWD = configService.get('ADMIN_PWD');