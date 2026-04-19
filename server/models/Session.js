const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    metadata: {
        disease: String,
        query: String,
        location: String,
        publicationsCount: Number,
        trialsCount: Number
    },
    timestamp: { type: Date, default: Date.now }
});

const SessionSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, unique: true, index: true },
    patientName: { type: String, default: '' },
    messages: [MessageSchema],
    bookmarks: [{
        type: { type: String, enum: ['publication', 'trial'] },
        itemId: String,
        title: String,
        url: String,
        savedAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Index for fast lookup
SessionSchema.index({ sessionId: 1, createdAt: -1 });

module.exports = mongoose.model('Session', SessionSchema);
