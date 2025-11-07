
export enum SundayCycle {
  A = 'A',
  B = 'B',
  C = 'C',
}

export enum WeekdayCycle {
  I = 'I',
  II = 'II',
}

export enum LiturgicalSeason {
  Adviento = 'Adviento',
  Navidad = 'Navidad',
  Cuaresma = 'Cuaresma',
  TriduoPascual = 'Triduo Pascual',
  Pascua = 'Pascua',
  Ordinario = 'T. Ordinario',
}

export enum CelebrationType {
  Solemnidad = 'Solemnidad',
  Fiesta = 'Fiesta',
  MemoriaObligatoria = 'Memoria Obligatoria',
  MemoriaLibre = 'Memoria Libre',
  Feria = 'Feria',
}

export interface Reading {
  cita: string;
  texto: string;
}

export interface LiturgicalDay {
  fecha: string;
  diaLiturgico: string;
  tiempoLiturgico: LiturgicalSeason;
  cicloDominical: SundayCycle | null;
  cicloFerial: WeekdayCycle | null;
  tipoCelebracion: CelebrationType;
  primeraLectura: Reading;
  salmoResponsorial: Reading;
  segundaLectura: Reading | null;
  evangelio: Reading;
  audioSrc?: string;
}
