import * as mongoose from 'mongoose';

export interface Metadata extends mongoose.Document {
    name: string;
    tags: string[];
}
