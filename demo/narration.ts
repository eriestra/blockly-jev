/** A short narration, decoded once and driven by the audio output clock. */
export class Narration extends EventTarget {
  private context?: AudioContext;
  private gain?: GainNode;
  private source?: AudioBufferSourceNode;
  private buffer?: AudioBuffer;
  private loading?: Promise<AudioBuffer>;
  private request = new AbortController();
  private offset = 0;
  private startedAt = 0;
  private generation = 0;
  private disposed = false;
  private silent = false;

  constructor(private url: string, private duration: number) { super(); }

  get paused() { return !this.source; }
  get ended() { return this.currentTime >= this.duration; }
  get currentTime() {
    return Math.min(this.duration, this.offset + (this.source ? this.context!.currentTime - this.startedAt : 0));
  }
  set currentTime(value: number) {
    const playing = !this.paused;
    this.stopSource();
    this.offset = Math.max(0, Math.min(this.duration, value));
    if (playing && !this.ended) this.startSource();
    this.dispatchEvent(new Event('seeked'));
    if (playing && this.ended) this.dispatchEvent(new Event('ended'));
  }
  get muted() { return this.silent; }
  set muted(value: boolean) {
    this.silent = value;
    if (this.gain) this.gain.gain.value = value ? 0 : 1;
  }

  async play() {
    if (this.disposed) throw new DOMException('Player disposed', 'AbortError');
    if (!this.paused) return;
    const generation = ++this.generation;
    // Create/resume synchronously in the click handler, before any network/font await.
    if (!this.context) {
      this.context = new AudioContext();
      this.gain = this.context.createGain();
      this.gain.gain.value = this.silent ? 0 : 1;
      this.gain.connect(this.context.destination);
      this.context.addEventListener('statechange', () => {
        if (this.context?.state !== 'running' && this.source) this.pause();
      });
    }
    const resumed = this.context.resume();
    if (!this.loading) {
      this.loading = fetch(this.url, { signal: this.request.signal })
        .then(response => {
          if (!response.ok) throw new Error('Narration download failed');
          return response.arrayBuffer();
        })
        .then(bytes => this.context!.decodeAudioData(bytes))
        .catch(error => { this.loading = undefined; throw error; });
    }
    this.dispatchEvent(new Event('waiting'));
    const [, buffer] = await Promise.all([resumed, this.loading]);
    if (this.disposed || generation !== this.generation) throw new DOMException('Playback cancelled', 'AbortError');
    if (this.context.state !== 'running') throw new Error('Audio output is unavailable');
    this.buffer = buffer;
    this.duration = buffer.duration;
    if (this.ended) this.offset = 0;
    this.startSource();
    this.dispatchEvent(new Event('playing'));
  }

  private startSource() {
    const source = this.context!.createBufferSource();
    source.buffer = this.buffer!;
    source.connect(this.gain!);
    source.onended = () => {
      if (this.source !== source) return;
      this.offset = this.duration;
      this.stopSource();
      this.dispatchEvent(new Event('ended'));
    };
    this.startedAt = this.context!.currentTime;
    this.source = source;
    source.start(0, this.offset);
  }

  private stopSource() {
    if (!this.source) return;
    const source = this.source;
    this.offset = this.currentTime;
    this.source = undefined;
    source.onended = null;
    source.stop();
    source.disconnect();
  }

  pause() {
    ++this.generation;
    this.stopSource();
    this.dispatchEvent(new Event('pause'));
  }

  dispose() {
    this.disposed = true;
    this.pause();
    this.request.abort();
    this.gain?.disconnect();
    void this.context?.close();
  }
}
