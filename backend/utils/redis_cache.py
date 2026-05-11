import redis
import json
from typing import Optional, Any
from datetime import timedelta
from core.config import config

class RedisCache:
    def __init__(self):
        self.redis_client = redis.from_url(config.REDIS_URL) if config.REDIS_URL else None
        self.default_ttl = 300  # 5 minutes
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if not self.redis_client:
            return None
        
        try:
            value = self.redis_client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            print(f"Redis get error: {e}")
            return None
    
    def set(self, key: str, value: Any, ttl: int = None) -> bool:
        """Set value in cache"""
        if not self.redis_client:
            return False
        
        try:
            self.redis_client.setex(
                key, 
                ttl or self.default_ttl,
                json.dumps(value, default=str)
            )
            return True
        except Exception as e:
            print(f"Redis set error: {e}")
            return False
    
    def delete(self, key: str) -> bool:
        """Delete key from cache"""
        if not self.redis_client:
            return False
        
        try:
            self.redis_client.delete(key)
            return True
        except Exception as e:
            print(f"Redis delete error: {e}")
            return False
    
    def clear_pattern(self, pattern: str) -> bool:
        """Clear all keys matching pattern"""
        if not self.redis_client:
            return False
        
        try:
            keys = self.redis_client.keys(pattern)
            if keys:
                self.redis_client.delete(*keys)
            return True
        except Exception as e:
            print(f"Redis clear pattern error: {e}")
            return False

redis_cache = RedisCache()