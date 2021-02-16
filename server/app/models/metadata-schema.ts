import * as mongoose from 'mongoose';
import { Metadata } from './metadata';

const metadataSchema: mongoose.Schema = new mongoose.Schema({
    name: { type: String, required: true },
    tags: { type: [String], required: true }
});

export default mongoose.model<Metadata>('Metadata', metadataSchema);
