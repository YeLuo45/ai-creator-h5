/**
 * VideoService Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateVideo, getHistory, clearHistory } from '../src/services/videoService.js';
import { MiniMaxVideoAdapter } from '../src/adapter/MiniMaxAdapter.js';

vi.mock('../src/adapter/MiniMaxAdapter.js', () => ({
  MiniMaxVideoAdapter: vi.fn()
}));

describe('VideoService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    // Reset fetch if needed
    if (globalThis.fetch) globalThis.fetch.mockClear?.();
  });

  describe('generateVideo', () => {
    it('should throw error when API key not configured', async () => {
      // No API key set
      await expect(generateVideo({ prompt: 'test', duration: 5 }))
        .rejects.toThrow('请先在"我的"页面配置 MiniMax API Key');
    });

    it('should generate video and return URL', async () => {
      localStorage.setItem('ai_creator_minimax_api_key', JSON.stringify('test-api-key'));

      const mockResult = {
        data: {
          video_url: 'https://example.com/video.mp4',
          cover_image_url: 'https://example.com/cover.jpg'
        }
      };

      const mockAdapterInstance = {
        generate: vi.fn().mockResolvedValue(mockResult)
      };
      MiniMaxVideoAdapter.mockImplementation(() => mockAdapterInstance);

      const result = await generateVideo({ prompt: 'a cat', duration: 10 });

      expect(MiniMaxVideoAdapter).toHaveBeenCalledWith('test-api-key');
      expect(mockAdapterInstance.generate).toHaveBeenCalledWith({ prompt: 'a cat', duration: 10 });
      expect(result.url).toBe('https://example.com/video.mp4');
    });

    it('should add successful result to history', async () => {
      localStorage.setItem('ai_creator_minimax_api_key', JSON.stringify('test-api-key'));

      const mockResult = {
        data: {
          video_url: 'https://example.com/video.mp4',
          cover_image_url: 'https://example.com/cover.jpg'
        }
      };

      const mockAdapterInstance = {
        generate: vi.fn().mockResolvedValue(mockResult)
      };
      MiniMaxVideoAdapter.mockImplementation(() => mockAdapterInstance);

      await generateVideo({ prompt: 'a cat', duration: 10 });

      const history = getHistory();
      expect(history.length).toBe(1);
      expect(history[0].url).toBe('https://example.com/video.mp4');
      expect(history[0].prompt).toBe('a cat');
      expect(history[0].duration).toBe(10);
    });

    it('should throw error on API error with status_msg', async () => {
      localStorage.setItem('ai_creator_minimax_api_key', JSON.stringify('test-api-key'));

      const mockResult = {
        base_resp: { status_msg: 'Invalid parameters' }
      };

      const mockAdapterInstance = {
        generate: vi.fn().mockResolvedValue(mockResult)
      };
      MiniMaxVideoAdapter.mockImplementation(() => mockAdapterInstance);

      await expect(generateVideo({ prompt: 'test', duration: 5 }))
        .rejects.toThrow('API 错误: Invalid parameters');
    });

    it('should handle unexpected result structure without throwing', async () => {
      localStorage.setItem('ai_creator_minimax_api_key', JSON.stringify('test-api-key'));

      const mockResult = { unexpected: 'structure' };

      const mockAdapterInstance = {
        generate: vi.fn().mockResolvedValue(mockResult)
      };
      MiniMaxVideoAdapter.mockImplementation(() => mockAdapterInstance);

      const result = await generateVideo({ prompt: 'test', duration: 5 });
      expect(result).toHaveProperty('unexpected');
    });

    it('should use default duration 5 when not specified', async () => {
      localStorage.setItem('ai_creator_minimax_api_key', JSON.stringify('test-api-key'));

      const mockResult = { data: { video_url: 'url' } };
      const mockAdapterInstance = {
        generate: vi.fn().mockResolvedValue(mockResult)
      };
      MiniMaxVideoAdapter.mockImplementation(() => mockAdapterInstance);

      await generateVideo({ prompt: 'test' });

      expect(mockAdapterInstance.generate).toHaveBeenCalledWith({ prompt: 'test', duration: 5 });
    });

    it('should propagate adapter errors', async () => {
      localStorage.setItem('ai_creator_minimax_api_key', JSON.stringify('test-api-key'));

      const mockAdapterInstance = {
        generate: vi.fn().mockRejectedValue(new Error('Network error'))
      };
      MiniMaxVideoAdapter.mockImplementation(() => mockAdapterInstance);

      await expect(generateVideo({ prompt: 'test', duration: 5 }))
        .rejects.toThrow('Network error');
    });
  });

  describe('getHistory', () => {
    it('should return empty array when no history', () => {
      localStorage.removeItem('ai_creator_history_videos');
      expect(getHistory()).toEqual([]);
    });

    it('should return stored history', () => {
      const testHistory = [
        { id: 1, prompt: 'test1', url: 'url1', createdAt: '2024-01-01' }
      ];
      localStorage.setItem('ai_creator_history_videos', JSON.stringify(testHistory));
      expect(getHistory()).toEqual(testHistory);
    });
  });

  describe('clearHistory', () => {
    it('should remove history from storage', () => {
      const testHistory = [{ id: 1, prompt: 'test' }];
      localStorage.setItem('ai_creator_history_videos', JSON.stringify(testHistory));
      clearHistory();
      expect(localStorage.getItem('ai_creator_history_videos')).toBeNull();
    });
  });

  describe('history limit', () => {
    it('should limit history to 50 items', async () => {
      localStorage.setItem('ai_creator_minimax_api_key', JSON.stringify('test-api-key'));

      const mockResult = {
        data: { video_url: 'https://example.com/video.mp4' }
      };
      const mockAdapterInstance = {
        generate: vi.fn().mockResolvedValue(mockResult)
      };
      MiniMaxVideoAdapter.mockImplementation(() => mockAdapterInstance);

      // Add 51 items
      for (let i = 0; i < 51; i++) {
        await generateVideo({ prompt: `test${i}`, duration: 5 });
      }

      const history = getHistory();
      expect(history.length).toBe(50);
    });
  });
});
