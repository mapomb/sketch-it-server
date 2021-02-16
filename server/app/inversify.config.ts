import { Container } from 'inversify';
import { Application } from './app';
import { Server } from './server';
import Types from './types';

const container: Container = new Container();

container.bind(Types.Server).to(Server);
container.bind(Types.Application).to(Application);
export { container };
