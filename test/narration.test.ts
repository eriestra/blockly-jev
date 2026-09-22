import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Narration } from '../demo/narration';

class TestContext extends EventTarget {
  static latest: TestContext;
  currentTime = 0;
  state = 'suspended';
  destination = {};
  sources: any[] = [];
  gain = { gain: { value: 1 }, connect: vi.fn(), disconnect: vi.fn() };
  constructor() { super(); TestContext.latest = this; }
  resume = vi.fn(async () => { this.state = 'running'; });
  close = vi.fn(async () => { this.state = 'closed'; });
  decodeAudioData = vi.fn(async () => ({ duration: 50 }));
  createGain() { return this.gain; }
  createBufferSource() {
    const source = { buffer: null, onended: null, connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), stop: vi.fn() };
    this.sources.push(source); return source;
  }
}

beforeEach(() => {
  vi.stubGlobal('AudioContext', TestContext);
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) })));
});
afterEach(() => vi.unstubAllGlobals());

describe('narration playback', () => {
  it('unlocks immediately and uses the audio clock for pause, resume and seek', async () => {
    const audio = new Narration('/track.mp3', 50);
    const started = audio.play();
    const context = TestContext.latest;
    expect(context.resume).toHaveBeenCalledOnce();
    await started;
    context.currentTime = 3;
    expect(audio.currentTime).toBe(3);
    audio.pause(); context.currentTime = 8;
    expect(audio.currentTime).toBe(3);
    await audio.play();
    expect(context.sources[1].start).toHaveBeenCalledWith(0, 3);
    context.currentTime = 10;
    expect(audio.currentTime).toBe(5);
    audio.currentTime = 20;
    expect(context.sources[1].stop).toHaveBeenCalledOnce();
    expect(context.sources[2].start).toHaveBeenCalledWith(0, 20);
    context.currentTime = 12;
    expect(audio.currentTime).toBe(22);
    expect(context.decodeAudioData).toHaveBeenCalledOnce();
    audio.dispose();
  });

  it('mutes the output and handles the end without leaving a playing state', async () => {
    const audio = new Narration('/track.mp3', 50);
    audio.muted = true;
    await audio.play();
    const context = TestContext.latest;
    expect(context.gain.gain.value).toBe(0);
    audio.muted = false;
    expect(context.gain.gain.value).toBe(1);
    const ended = vi.fn(); audio.addEventListener('ended', ended);
    context.currentTime = 50;
    context.sources[0].onended();
    expect(audio.ended).toBe(true); expect(audio.paused).toBe(true);
    expect(ended).toHaveBeenCalledOnce();
    await audio.play();
    expect(context.sources[1].start).toHaveBeenCalledWith(0, 0);
    audio.dispose();
  });

  it('cancels a pending start when the learner leaves the lesson', async () => {
    let resolve!: (value: any) => void;
    vi.stubGlobal('fetch', vi.fn(() => new Promise(r => { resolve = r; })));
    const audio = new Narration('/track.mp3', 50);
    const started = audio.play();
    const rejected = expect(started).rejects.toMatchObject({ name: 'AbortError' });
    audio.dispose();
    resolve({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) });
    await rejected;
    expect(TestContext.latest.sources).toHaveLength(0);
    expect(TestContext.latest.close).toHaveBeenCalledOnce();
  });

  it('allows a failed download to be retried', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response);
    const audio = new Narration('/track.mp3', 50);
    await expect(audio.play()).rejects.toThrow('download failed');
    expect(audio.paused).toBe(true);
    await audio.play();
    expect(audio.paused).toBe(false);
    audio.dispose();
  });
});
