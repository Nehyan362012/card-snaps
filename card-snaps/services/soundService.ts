
class SoundService {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  private init() {
    if (!this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = 0.3; // Global volume
      this.masterGain.connect(this.context.destination);
    }
  }

  public playClick() {
    this.init();
    if (!this.context || !this.masterGain) return;

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.context.currentTime + 0.05);

    gain.gain.setValueAtTime(0, this.context.currentTime);
    gain.gain.linearRampToValueAtTime(0.5, this.context.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.context.currentTime + 0.1);
  }

  public playFlip() {
    this.init();
    if (!this.context || !this.masterGain) return;

    // Create noise buffer for "swoosh"
    const bufferSize = this.context.sampleRate * 0.2; // 200ms
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.context.createBufferSource();
    noise.buffer = buffer;

    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, this.context.currentTime);
    filter.frequency.linearRampToValueAtTime(1500, this.context.currentTime + 0.15);

    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0, this.context.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, this.context.currentTime + 0.05);
    gain.gain.linearRampToValueAtTime(0, this.context.currentTime + 0.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start();
  }

  public playSuccess() {
    this.init();
    if (!this.context || !this.masterGain) return;

    const now = this.context.currentTime;
    
    // Chord
    [440, 554.37, 659.25].forEach((freq, i) => {
        const osc = this.context!.createOscillator();
        const gain = this.context!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.05);
        gain.gain.setValueAtTime(0, now + i * 0.05);
        gain.gain.linearRampToValueAtTime(0.2, now + i * 0.05 + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.6);
        
        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.7);
    });
  }
  
  public playPop() {
      this.init();
      if (!this.context || !this.masterGain) return;
      
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      
      osc.frequency.setValueAtTime(600, this.context.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, this.context.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0.5, this.context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      
      osc.start();
      osc.stop(this.context.currentTime + 0.1);
  }

  public playLevelUp() {
    this.init();
    if (!this.context || !this.masterGain) return;
    const now = this.context.currentTime;
    // Arpeggio
    [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50].forEach((freq, i) => {
        const osc = this.context!.createOscillator();
        const gain = this.context!.createGain();
        osc.type = i > 3 ? 'square' : 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0, now + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.1, now + i * 0.1 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.4);
        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.5);
    });
  }
}

export const soundService = new SoundService();
