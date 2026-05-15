/**
 * MiniMaxAdapter Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  MiniMaxAdapter,
  MiniMaxImageAdapter,
  MiniMaxMusicAdapter,
  MiniMaxLyricsAdapter,
  MiniMaxMusicCoverAdapter,
  MiniMaxTTSAdapter,
  MiniMaxVideoAdapter,
  MINIMAX_MODELS,
  createMiniMaxImageAdapter,
  createMiniMaxMusicAdapter,
  createMiniMaxLyricsAdapter,
  createMiniMaxMusicCoverAdapter,
  createMiniMaxTTSAdapter,
  createMiniMaxVideoAdapter,
} from '../src/adapter/MiniMaxAdapter.js';

describe('MINIMAX_MODELS', () => {
  it('should have all expected model IDs', () => {
    expect(MINIMAX_MODELS.IMAGE_01).toBe('image-01');
    expect(MINIMAX_MODELS.IMAGE_01_PRO).toBe('image-01-pro');
    expect(MINIMAX_MODELS.MUSIC_26).toBe('music-2.6');
    expect(MINIMAX_MODELS.LYRICS).toBe('lyrics_generation');
    expect(MINIMAX_MODELS.MUSIC_COVER).toBe('music-cover');
    expect(MINIMAX_MODELS.TTS_HD).toBe('speech-2.8-hd');
    expect(MINIMAX_MODELS.TTS).toBe('speech-02');
    expect(MINIMAX_MODELS.VIDEO_01).toBe('video-01');
  });
});

describe('MiniMaxAdapter', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  it('should create adapter with apiKey', () => {
    const adapter = new MiniMaxAdapter('test-key');
    expect(adapter.apiKey).toBe('test-key');
    expect(adapter.provider).toBe('minimax');
    expect(adapter.capabilities).toContain('image');
    expect(adapter.capabilities).toContain('text');
    expect(adapter.capabilities).toContain('music');
    expect(adapter.capabilities).toContain('audio');
  });

  it('should make successful request', async () => {
    const mockResponse = { data: { result: 'ok' } };
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const adapter = new MiniMaxAdapter('test-key');
    const result = await adapter.request('/test_endpoint', { foo: 'bar' });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.minimaxi.com/v1/test_endpoint',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-key',
        },
        body: JSON.stringify({ foo: 'bar' }),
      })
    );
    expect(result).toEqual(mockResponse);
  });

  it('should use GET method when specified', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: 'test' }),
    });

    const adapter = new MiniMaxAdapter('test-key');
    await adapter.request('/test', {}, 'GET');

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.minimaxi.com/v1/test',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('should not send body for GET requests', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    const adapter = new MiniMaxAdapter('test-key');
    await adapter.request('/test', { foo: 'bar' }, 'GET');

    const call = globalThis.fetch.mock.calls[0];
    expect(call[1].body).toBeUndefined();
  });

  it('should throw error on non-ok response', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'bad request' }),
    });

    const adapter = new MiniMaxAdapter('test-key');
    await expect(adapter.request('/test', {})).rejects.toThrow('MiniMax API Error: 400');
  });

  it('should handle TTS endpoint specially (binary audio)', async () => {
    const audioData = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(audioData.buffer),
    });

    const adapter = new MiniMaxAdapter('test-key');
    const result = await adapter.request('/t2a_v2', {});

    expect(result).toHaveProperty('audio');
    expect(typeof result.audio).toBe('string');
  });

  it('should throw error on TTS non-ok response', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Internal error'),
    });

    const adapter = new MiniMaxAdapter('test-key');
    await expect(adapter.request('/t2a_v2', {})).rejects.toThrow('MiniMax API Error: 500');
  });

  it('should handle healthCheck success', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { image_urls: ['url'] } }),
    });

    const adapter = new MiniMaxAdapter('test-key');
    const result = await adapter.healthCheck();
    expect(result).toBe(true);
  });

  it('should handle healthCheck failure', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({}),
    });

    const adapter = new MiniMaxAdapter('test-key');
    const result = await adapter.healthCheck();
    expect(result).toBe(false);
  });
});

describe('MiniMaxImageAdapter', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  it('should use image-01 model by default', () => {
    const adapter = new MiniMaxImageAdapter('test-key');
    expect(adapter.model).toBe('image-01');
  });

  it('should generate correct image payload', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { image_urls: ['http://example.com/img.jpg'] } }),
    });

    const adapter = new MiniMaxImageAdapter('test-key');
    await adapter.generate({ prompt: 'a cat', size: '1024x1024' });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/image_generation'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(expect.objectContaining({
          model: 'image-01',
          prompt: 'a cat',
          n: 1,
          aspect_ratio: '1:1',
        })),
      })
    );
  });

  it('should map size 1792x1024 to 16:9', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { image_urls: [] } }),
    });

    const adapter = new MiniMaxImageAdapter('test-key');
    await adapter.generate({ prompt: 'test', size: '1792x1024' });

    const call = globalThis.fetch.mock.calls[0];
    expect(JSON.parse(call[1].body).aspect_ratio).toBe('16:9');
  });

  it('should map size 1024x1792 to 9:16', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { image_urls: [] } }),
    });

    const adapter = new MiniMaxImageAdapter('test-key');
    await adapter.generate({ prompt: 'test', size: '1024x1792' });

    const call = globalThis.fetch.mock.calls[0];
    expect(JSON.parse(call[1].body).aspect_ratio).toBe('9:16');
  });

  it('should handle sizeToAspectRatio edge cases', () => {
    const adapter = new MiniMaxImageAdapter('test-key');
    expect(adapter.sizeToAspectRatio('1024x1024')).toBe('1:1');
    expect(adapter.sizeToAspectRatio('1792x1024')).toBe('16:9');
    expect(adapter.sizeToAspectRatio('1024x1792')).toBe('9:16');
    expect(adapter.sizeToAspectRatio('unknown')).toBe('1:1');
  });
});

describe('MiniMaxMusicAdapter', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  it('should use music-2.6 model by default', () => {
    const adapter = new MiniMaxMusicAdapter('test-key');
    expect(adapter.model).toBe('music-2.6');
  });

  it('should generate correct music payload', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { audio: 'hexstring', status: 2 } }),
    });

    const adapter = new MiniMaxMusicAdapter('test-key');
    await adapter.generate({ prompt: 'happy song', lyrics: 'hello world' });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/music_generation'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(expect.objectContaining({
          model: 'music-2.6',
          prompt: 'happy song',
          lyrics: 'hello world',
        })),
      })
    );
  });
});

describe('MiniMaxLyricsAdapter', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  it('should use lyrics_generation model', () => {
    const adapter = new MiniMaxLyricsAdapter('test-key');
    expect(adapter.model).toBe('lyrics_generation');
  });

  it('should generate correct lyrics payload', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { lyrics: 'test' } }),
    });

    const adapter = new MiniMaxLyricsAdapter('test-key');
    await adapter.generate({ prompt: 'love song', genre: 'pop', theme: 'love' });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/lyrics_generation'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(expect.objectContaining({
          model: 'lyrics_generation',
          prompt: 'love song',
          genre: 'pop',
          theme: 'love',
        })),
      })
    );
  });
});

describe('MiniMaxMusicCoverAdapter', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  it('should generate cover image using image-01 model', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { image_urls: ['url'] } }),
    });

    const adapter = new MiniMaxMusicCoverAdapter('test-key');
    await adapter.generate({ prompt: 'music cover art' });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/image_generation'),
      expect.objectContaining({
        body: JSON.stringify(expect.objectContaining({
          model: 'image-01',
          prompt: 'music cover art',
          aspect_ratio: '1:1',
        })),
      })
    );
  });
});

describe('MiniMaxTTSAdapter', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  it('should use speech-2.8-hd model by default', () => {
    const adapter = new MiniMaxTTSAdapter('test-key');
    expect(adapter.model).toBe('speech-2.8-hd');
  });

  it('should have static VOICE_LIST', () => {
    expect(MiniMaxTTSAdapter.VOICE_LIST).toBeDefined();
    expect(Array.isArray(MiniMaxTTSAdapter.VOICE_LIST)).toBe(true);
    expect(MiniMaxTTSAdapter.VOICE_LIST.length).toBeGreaterThan(0);
    expect(MiniMaxTTSAdapter.VOICE_LIST[0]).toHaveProperty('id');
    expect(MiniMaxTTSAdapter.VOICE_LIST[0]).toHaveProperty('name');
  });

  it('should generate TTS with correct payload', async () => {
    const audioData = new Uint8Array([72, 101, 108, 108, 111]);
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(audioData.buffer),
    });

    const adapter = new MiniMaxTTSAdapter('test-key');
    const result = await adapter.generate({ input: 'hello', voice: 'female-shaonv' });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/t2a_v2'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(expect.objectContaining({
          model: 'speech-2.8-hd',
          text: 'hello',
          voice_setting: expect.objectContaining({
            voice_id: 'female-shaonv',
          }),
        })),
      })
    );
    expect(result).toHaveProperty('b64_audio');
  });

  it('should handle TTS with text alias', async () => {
    const audioData = new Uint8Array([72]);
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(audioData.buffer),
    });

    const adapter = new MiniMaxTTSAdapter('test-key');
    const result = await adapter.generate({ text: 'hello' });

    const call = globalThis.fetch.mock.calls[0];
    expect(JSON.parse(call[1].body).text).toBe('hello');
  });

  it('should throw error on TTS API failure', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Server error'),
    });

    const adapter = new MiniMaxTTSAdapter('test-key');
    await expect(adapter.generate({ input: 'test' })).rejects.toThrow('MiniMax API Error: 500');
  });
});

describe('MiniMaxVideoAdapter', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  it('should use video-01 model by default', () => {
    const adapter = new MiniMaxVideoAdapter('test-key');
    expect(adapter.model).toBe('video-01');
  });

  it('should generate correct video payload', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { video_url: 'http://example.com/v.mp4' } }),
    });

    const adapter = new MiniMaxVideoAdapter('test-key');
    await adapter.generate({ prompt: 'a cat playing', duration: 5 });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/video_generation'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(expect.objectContaining({
          model: 'video-01',
          prompt: 'a cat playing',
          duration: 5,
          resolution: '720p',
        })),
      })
    );
  });

  it('should use default duration 5 and resolution 720p', async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { video_url: 'url' } }),
    });

    const adapter = new MiniMaxVideoAdapter('test-key');
    await adapter.generate({ prompt: 'test' });

    const call = globalThis.fetch.mock.calls[0];
    const body = JSON.parse(call[1].body);
    expect(body.duration).toBe(5);
    expect(body.resolution).toBe('720p');
  });
});

describe('Factory functions', () => {
  it('should create MiniMaxImageAdapter', () => {
    const adapter = createMiniMaxImageAdapter('key');
    expect(adapter).toBeInstanceOf(MiniMaxImageAdapter);
    expect(adapter).toBeInstanceOf(MiniMaxAdapter);
  });

  it('should create MiniMaxMusicAdapter', () => {
    const adapter = createMiniMaxMusicAdapter('key');
    expect(adapter).toBeInstanceOf(MiniMaxMusicAdapter);
    expect(adapter).toBeInstanceOf(MiniMaxAdapter);
  });

  it('should create MiniMaxLyricsAdapter', () => {
    const adapter = createMiniMaxLyricsAdapter('key');
    expect(adapter).toBeInstanceOf(MiniMaxLyricsAdapter);
    expect(adapter).toBeInstanceOf(MiniMaxAdapter);
  });

  it('should create MiniMaxMusicCoverAdapter', () => {
    const adapter = createMiniMaxMusicCoverAdapter('key');
    expect(adapter).toBeInstanceOf(MiniMaxMusicCoverAdapter);
    expect(adapter).toBeInstanceOf(MiniMaxAdapter);
  });

  it('should create MiniMaxTTSAdapter', () => {
    const adapter = createMiniMaxTTSAdapter('key');
    expect(adapter).toBeInstanceOf(MiniMaxTTSAdapter);
    expect(adapter).toBeInstanceOf(MiniMaxAdapter);
  });

  it('should create MiniMaxVideoAdapter', () => {
    const adapter = createMiniMaxVideoAdapter('key');
    expect(adapter).toBeInstanceOf(MiniMaxVideoAdapter);
    expect(adapter).toBeInstanceOf(MiniMaxAdapter);
  });
});
