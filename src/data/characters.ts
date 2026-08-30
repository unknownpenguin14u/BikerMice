import { Character } from '../types';

export const CHARACTERS: Character[] = [
  {
    id: 'throttle',
    name: 'Throttle',
    nickname: 'The Field Commander',
    role: 'protagonist',
    bio: 'The charismatic tan-furred leader with iconic green sunglasses and martial arts discipline. His Martian super-chopper is impeccably balanced with photon laser bursts.',
    quote: 'In this life there are that who rock, and those who roll!',
    voiceLine: "Let's Rock and Ride!",
    bikeName: 'Martian Lightning Chopper',
    bikeColor: '#ef4444', // Crimson Red
    accentColor: '#f59e0b', // Amber
    glowColor: 'rgba(239, 68, 68, 0.6)',
    stats: {
      topSpeed: 215,
      acceleration: 195,
      handling: 210,
      armor: 200,
      specialWeaponId: 'blaster'
    },
    portrait: 'throttle',
    unlocked: true
  },
  {
    id: 'modo',
    name: 'Modo',
    nickname: 'The One-Eyed Powerhouse',
    role: 'protagonist',
    bio: 'The gentle gray giant with a bionic arm and robotic left eye. Heart of gold, but never insult his mama or his heavy cruiser bike. Supreme ramming power & rocket payload.',
    quote: 'My mama told me never get mad... but she ain’t here right now!',
    voiceLine: "Eat my Martian dust!",
    bikeName: 'Titanium Bionic Cruiser',
    bikeColor: '#64748b', // Slate Gray
    accentColor: '#38bdf8', // Cyber Blue
    glowColor: 'rgba(56, 189, 248, 0.6)',
    stats: {
      topSpeed: 230,
      acceleration: 170,
      handling: 175,
      armor: 250,
      specialWeaponId: 'homing_missile'
    },
    portrait: 'modo',
    unlocked: true
  },
  {
    id: 'vinnie',
    name: 'Vinnie',
    nickname: 'The White Flash',
    role: 'protagonist',
    bio: 'The white-furred daredevil sporting a metal faceplate. Pure adrenaline junkie with hypersonic acceleration and unmatched drift precision.',
    quote: 'What a rush! I love the smell of burning rubber in the morning!',
    voiceLine: "Catch me if you can, greaseball!",
    bikeName: 'Hyper-Sonic Flare Roadster',
    bikeColor: '#f8fafc', // Pearl White
    accentColor: '#ec4899', // Hot Pink
    glowColor: 'rgba(236, 72, 153, 0.6)',
    stats: {
      topSpeed: 205,
      acceleration: 245,
      handling: 240,
      armor: 170,
      specialWeaponId: 'turbo_nitro'
    },
    portrait: 'vinnie',
    unlocked: true
  },
  {
    id: 'limburger',
    name: 'Lawrence Limburger',
    nickname: 'Plutarkian Overlord',
    role: 'villain',
    bio: 'The foul-smelling Plutarkian disguised as a Chicago billionaire tycoon. Cheats with greasy bribes, stinky smog clouds, and heavy corporate armor.',
    quote: 'Those meddling mice will pay for ruining my profit margins!',
    voiceLine: "Guards! Obliterate them!",
    bikeName: 'Plutarkian Luxury Super-Trike',
    bikeColor: '#84cc16', // Toxic Lime
    accentColor: '#4d7c0f', // Slime Green
    glowColor: 'rgba(132, 204, 22, 0.6)',
    stats: {
      topSpeed: 220,
      acceleration: 180,
      handling: 165,
      armor: 235,
      specialWeaponId: 'oil_slick'
    },
    portrait: 'limburger',
    unlocked: false
  },
  {
    id: 'karbunkle',
    name: 'Dr. Karbunkle',
    nickname: 'The Twisted Geneticist',
    role: 'villain',
    bio: 'The sycophantic mad scientist in thick goggles. Operates mutagenic engines and seismic ground-shattering frequency generators.',
    quote: 'Observe the majesty of my seismic resonance generator!',
    voiceLine: "Feel the wrath of Plutark science!",
    bikeName: 'Mutagenic Quad-Hover',
    bikeColor: '#a855f7', // Purple
    accentColor: '#3b82f6', // Electric Indigo
    glowColor: 'rgba(168, 85, 247, 0.6)',
    stats: {
      topSpeed: 210,
      acceleration: 205,
      handling: 215,
      armor: 185,
      specialWeaponId: 'earthquake'
    },
    portrait: 'karbunkle',
    unlocked: false
  },
  {
    id: 'greasepit',
    name: 'Greasepit',
    nickname: 'The Oily Goon',
    role: 'villain',
    bio: 'Limburger’s bumbling, perpetually dripping cyborg lackey. Spills black sludge across every corner and rams blindly into obstacles.',
    quote: 'Boss, boss! I didn’t mean to leak all the motor oil!',
    voiceLine: "Gimme that trophy, mice!",
    bikeName: 'Sludge Roller Heavy Chopper',
    bikeColor: '#d97706', // Oily Amber / Rust
    accentColor: '#1e293b', // Tar Black
    glowColor: 'rgba(217, 119, 6, 0.6)',
    stats: {
      topSpeed: 195,
      acceleration: 160,
      handling: 160,
      armor: 260,
      specialWeaponId: 'oil_slick'
    },
    portrait: 'greasepit',
    unlocked: true
  }
];

export const CHARLEY_DAVIDSON = {
  name: 'Charley Davidson',
  title: 'Master Mechanic & Last Chance Garage Boss',
  bio: 'The smartest mechanic in Chicago. Keeps the Biker Mice tuned with hot nitro, reinforced steel plates, and military-grade Martian hardware.',
  quote: "Bring her into the pit, boys! Let's see what we can soup up today!"
};
