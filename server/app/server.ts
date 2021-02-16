import * as http from 'http';
import { inject, injectable } from 'inversify';
import { Application } from './app';
import Types from './types';



@injectable()
export class Server {

    private readonly appPort: string | number | boolean = this.normalizePort(process.env.PORT || '3000');
    private readonly baseDix: number = 10;
    private server: http.Server;
    private io: any;

    constructor(@inject(Types.Application) private application: Application) {}

    init(): void {
        this.application.app.set('port', this.appPort);
        
        this.server = http.createServer(this.application.app);

         // *** added for the new project
         this.io = require("socket.io")(this.server, {
            cors: {
                origin: "http://localhost:4200", // changed
                methods: ["GET", "POST"],
                allowedHeathers: ["Access-Control-Allow-Origin"],
                credentials: true, // added
                transports: ['websocket'] //added
            },
            allowEIO3: true // added
        });

        this.io.on("connect", (socket: any) => {
            socket.emit('messagefromserver', "hello android")
            socket.on('user-connect', (data: any) => {
                console.log(data);
                socket.broadcast.emit('new-user',data); 
            });
            
            socket.on('message', (data: any) => {
                console.log(data);
                socket.broadcast.emit('new-message',data); 
            });
        });

        this.application.app.get("/", (req: any, res: any) => {
            res.send("hello world");
          });
          
        // ***

        this.server.listen(this.appPort);
        this.server.on('error', (error: NodeJS.ErrnoException) => this.onError(error));
        this.server.on('listening', () => this.onListening());
    }

    private normalizePort(val: number | string): number | string | boolean {
        const port: number = typeof val === 'string' ? parseInt(val, this.baseDix) : val;
        if (isNaN(port)) {
            return val;
        } else if (port >= 0) {
            return port;
        } else {
            return false;
        }
    }

    private onError(error: NodeJS.ErrnoException): void {
        if (error.syscall !== 'listen') {
            throw error;
        }
        const bind: string = typeof this.appPort === 'string' ? 'Pipe ' + this.appPort : 'Port ' + this.appPort;
        switch (error.code) {
            case 'EACCES':
                console.error(`${bind} requires elevated privileges`);
                process.exit(1);
                break;
            case 'EADDRINUSE':
                console.error(`${bind} is already in use`);
                process.exit(1);
                break;
            default:
                throw error;
        }
    }

    /**
     * Se produit lorsque le serveur se met à écouter sur le port.
     */
    private onListening(): void {
        const addr = this.server.address();
        // tslint:disable-next-line:no-non-null-assertion
        const bind: string = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr!.port}`;
        // tslint:disable-next-line:no-console
        console.log(`Listening on ${bind}`);
    }
}
