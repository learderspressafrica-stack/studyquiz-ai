class AudioService {
  private synth: SpeechSynthesis | null = null;
  private utterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  // Démarrer la lecture vocale du cours
  public speak(text: string, onEndCallback?: () => void) {
    if (!this.synth) {
      console.error("La synthèse vocale n'est pas disponible.");
      return;
    }

    // Stopper toute lecture précédente
    this.stop();

    this.utterance = new SpeechSynthesisUtterance(text);
    this.utterance.lang = 'fr-FR'; // Voix en français
    this.utterance.rate = 1.0;     // Vitesse normale

    if (onEndCallback) {
      this.utterance.onend = onEndCallback;
    }

    this.synth.speak(this.utterance);
  }

  // Mettre l'audio en pause
  public pause() {
    if (this.synth && this.synth.speaking) {
      this.synth.pause();
    }
  }

  // Reprendre la lecture audio
  public resume() {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
  }

  // Arrêter l'audio
  public stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }
}

export const audioService = new AudioService();