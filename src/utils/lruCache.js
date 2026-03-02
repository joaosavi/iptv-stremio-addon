// Minimal LRU + TTL cache used when Redis is not configured
class LRUCache {
    constructor({ max = 100, ttl = 6 * 3600 * 1000 } = {}) {
        this.max = max;
        this.ttl = ttl;
        this.map = new Map(); // key -> { value, expires }
    }

    _now() { return Date.now(); }

    _pruneExpired() {
        const now = this._now();
        for (const [k, v] of this.map.entries()) {
            if (v.expires && v.expires < now) {
                this.map.delete(k);
            }
        }
    }

    get(key) {
        this._pruneExpired();
        if (!this.map.has(key)) return undefined;
        const entry = this.map.get(key);
        if (entry.expires && entry.expires < this._now()) {
            this.map.delete(key);
            return undefined;
        }
        // Promote (LRU)
        this.map.delete(key);
        this.map.set(key, entry);
        return entry.value;
    }

    set(key, value) {
        this._pruneExpired();
        if (this.map.has(key)) this.map.delete(key);
        this.map.set(key, { value, expires: this.ttl ? this._now() + this.ttl : null });
        // Evict LRU
        if (this.map.size > this.max) {
            const oldestKey = this.map.keys().next().value;
            this.map.delete(oldestKey);
        }
    }

    delete(key) {
        this.map.delete(key);
    }

    has(key) {
        return this.get(key) !== undefined;
    }

    keys() {
        this._pruneExpired();
        return Array.from(this.map.keys());
    }

    clear() {
        this.map.clear();
    }
}

module.exports = LRUCache;