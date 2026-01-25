import { EventEmitter } from 'events';

class IngestionEmitter extends EventEmitter {}

export const ingestionEvents = new IngestionEmitter();