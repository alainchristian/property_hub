import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

config();

export const databaseConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'property_mgmt',
  username: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'admin',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
};

// Used by TypeORM CLI
export default new DataSource(databaseConfig);
