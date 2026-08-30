import { StoryChapter } from '../types';

export const STORY_CHAPTERS: StoryChapter[] = [
  {
    id: 1,
    title: 'Act I: Rumble in the Windy City',
    location: 'Chicago Downtown Streets',
    trackId: 'chicago_streets',
    bossCharId: 'greasepit',
    storyIntro: [
      {
        speaker: 'Throttle',
        avatar: 'throttle',
        text: "Modo, Vinnie! Charley detected high-level Plutarkian seismic drills beneath Lake Michigan. Limburger's trying to strip-mine Earth just like they destroyed Mars!"
      },
      {
        speaker: 'Vinnie',
        avatar: 'vinnie',
        text: "Not on our watch! My throttle hand is itching. Let's hit the asphalt and turn Limburger's goons into roadkill!"
      },
      {
        speaker: 'Charley Davidson',
        avatar: 'charley',
        text: "I've tuned your engines with fresh Martian injectors. Take out Greasepit before he floods the expressway with sludge!"
      },
      {
        speaker: 'Greasepit',
        avatar: 'greasepit',
        text: "Boss Limburger told me to squash you mice! You won't make it past my crude oil slicks!"
      }
    ],
    storyOutro: [
      {
        speaker: 'Modo',
        avatar: 'modo',
        text: "Look at Greasepit spin into the hotdog cart! That's for messing with our city."
      },
      {
        speaker: 'Charley Davidson',
        avatar: 'charley',
        text: "Great racing boys! I grabbed 1,500 Mars Bucks from their bribe drop. Head to Last Chance Garage to soup up your ride!"
      }
    ],
    rewardCash: 1500,
    unlockCharacterId: 'greasepit'
  },
  {
    id: 2,
    title: 'Act II: The Red Sands of Home',
    location: 'Martian Canyon Rift',
    trackId: 'martian_canyons',
    bossCharId: 'karbunkle',
    storyIntro: [
      {
        speaker: 'Throttle',
        avatar: 'throttle',
        text: "Dr. Karbunkle opened a trans-dimensional rift to Mars to steal our remaining mineral cores! We're racing on home soil now."
      },
      {
        speaker: 'Dr. Karbunkle',
        avatar: 'karbunkle',
        text: "Hehehe! Fools! My seismic resonance generators will shatter your primitive motorcycles to dust!"
      },
      {
        speaker: 'Modo',
        avatar: 'modo',
        text: "Nobody disrespects Martian soil while my bionic arm is functioning. Let's rock and roll!"
      }
    ],
    storyOutro: [
      {
        speaker: 'Vinnie',
        avatar: 'vinnie',
        text: "Karbunkle's hover-bike just blew a gasket! He's running back to Limburger crying like a baby!"
      },
      {
        speaker: 'Throttle',
        avatar: 'throttle',
        text: "We secured the Martian core! Charley, load up the titanium armor plates!"
      }
    ],
    rewardCash: 2500,
    unlockCharacterId: 'karbunkle'
  },
  {
    id: 3,
    title: 'Act III: Toxic Slime Protocol',
    location: 'Underground Plutarkian Pipelines',
    trackId: 'plutarkian_sewers',
    bossCharId: 'karbunkle',
    storyIntro: [
      {
        speaker: 'Charley Davidson',
        avatar: 'charley',
        text: "Limburger's pumping concentrated radioactive mutagen into the water supply through the sewer main. Traction is near zero down there!"
      },
      {
        speaker: 'Throttle',
        avatar: 'throttle',
        text: "Time for high-speed drift maneuvers. Lock and load the photon blasters!"
      }
    ],
    storyOutro: [
      {
        speaker: 'Modo',
        avatar: 'modo',
        text: "That sewer is cleared out. Now there's only one place left: Limburger's penthouse penthouse sky tower!"
      }
    ],
    rewardCash: 3500
  },
  {
    id: 4,
    title: 'Act IV: Proving Grounds Showdown',
    location: 'Last Chance Super Speedway',
    trackId: 'charleys_speedway',
    storyIntro: [
      {
        speaker: 'Charley Davidson',
        avatar: 'charley',
        text: "Before we storm Limburger Tower, let's test your max nitro calibrations on the super-speedway track!"
      },
      {
        speaker: 'Vinnie',
        avatar: 'vinnie',
        text: "Full throttle, no brakes! Let's see who's the fastest mouse in the universe!"
      }
    ],
    storyOutro: [
      {
        speaker: 'Throttle',
        avatar: 'throttle',
        text: "The bikes are performing at 200% efficiency. Limburger is about to have the worst day of his slimy life."
      }
    ],
    rewardCash: 4500
  },
  {
    id: 5,
    title: 'Act V: Fall of Plutark Tower',
    location: 'Sky Fortress Apex',
    trackId: 'limburger_tower',
    bossCharId: 'limburger',
    storyIntro: [
      {
        speaker: 'Lawrence Limburger',
        avatar: 'limburger',
        text: "Curse you, rodents! You've destroyed my extraction pipelines! But atop my sky fortress, there are no guard rails! You'll plunge straight to the ground!"
      },
      {
        speaker: 'Throttle',
        avatar: 'throttle',
        text: "Biker Mice from Mars NEVER back down from a fight! It's freedom rock time!"
      },
      {
        speaker: 'Modo',
        avatar: 'modo',
        text: "Eat my rockets, Limburger!"
      }
    ],
    storyOutro: [
      {
        speaker: 'Throttle',
        avatar: 'throttle',
        text: "Limburger is down! Plutark Tower is collapsing! Earth and Mars are safe once again!"
      },
      {
        speaker: 'Charley Davidson',
        avatar: 'charley',
        text: "You boys did it! Root beer and hotdogs on the house at the Last Chance Garage forever!"
      },
      {
        speaker: 'Vinnie',
        avatar: 'vinnie',
        text: "Let's Rock and Ride into the sunset!"
      }
    ],
    rewardCash: 10000,
    unlockCharacterId: 'limburger'
  }
];
