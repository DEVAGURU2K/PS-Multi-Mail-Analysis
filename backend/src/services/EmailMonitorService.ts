import Imap from 'imap';
import { simpleParser } from 'mailparser';
import { EventEmitter } from 'events';

export interface EmailConfig {
    user: string;
    password: string;
    host: string;
    port: number;
    tls: boolean;
}

export class EmailMonitorService extends EventEmitter {
    private imap: Imap;
    private config: EmailConfig;

    constructor(config: EmailConfig) {
        super();
        this.config = config;
        this.imap = new Imap({
            user: config.user,
            password: config.password,
            host: config.host,
            port: config.port,
            tls: config.tls,
            tlsOptions: { rejectUnauthorized: false },
            authTimeout: 10000
        });

        this.setupListeners();
    }

    private setupListeners() {
        this.imap.once('ready', () => {
            console.log('IMAP Connection Ready');
            this.openInbox((err, box) => {
                if (err) throw err;
                console.log('Inbox opened. Listening for emails...');
                this.emit('connected');
            });
        });

        this.imap.once('error', (err: any) => {
            console.error('IMAP Error:', err);
            this.emit('error', err);
        });

        this.imap.once('end', () => {
            console.log('IMAP Connection Ended');
            this.emit('disconnected');
        });

        this.imap.on('mail', (numNew: number) => {
            console.log(`New email received: ${numNew}`);
            this.fetchNewEmails();
        });
    }

    public connect() {
        try {
            console.log(`Connecting to IMAP ${this.config.host}:${this.config.port} as ${this.config.user}...`);
            this.imap.connect();
        } catch (e) {
            console.error("Failed to initiate connection", e);
        }
    }

    private openInbox(cb: (err: Error, box: any) => void) {
        this.imap.openBox('INBOX', false, cb);
    }

    public fetchNewEmails() {
        this.openInbox((err, box) => {
            if (err) return;

            const f = this.imap.seq.fetch(box.messages.total + ':*', {
                bodies: '',
                struct: true
            });

            f.on('message', (msg: Imap.ImapMessage, seqno: number) => {
                console.log('Message #%d', seqno);
                msg.on('body', (stream: any, info: any) => {
                    simpleParser(stream, async (err, parsed) => {
                        if (err) {
                            console.error("Parse Error", err);
                            return;
                        }
                        console.log('Email Parsed:', parsed.subject);
                        this.emit('email', parsed);
                    });
                });
            });

            f.once('error', (err: any) => {
                console.log('Fetch error: ' + err);
            });

            f.once('end', () => {
                console.log('Done fetching all messages!');
            });
        });
    }

    public stop() {
        console.log(`Stopping IMAP connection for ${this.config.user}...`);
        this.imap.end();
    }
}
