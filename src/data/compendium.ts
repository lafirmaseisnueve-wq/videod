export const DIRECTORS = [
  {
    id: 'gen_aesthetics',
    name: 'Generative Aesthetics',
    description: 'Generative Aesthetics, Cinematic Photography, Digital Overlay, HUD Elements, Glitch Art, Tech Noir, Experimental Film',
    thumbnail: 'https://picsum.photos/seed/gen-aesthetics/800/450',
    prompt: 'Generative Aesthetics, Cinematic Photography, Digital Overlay, HUD Elements, Glitch Art, Tech Noir, Experimental Film, 555 aesthetic, neon glitch, data visualization overlays, dark urban atmosphere, high-tech low-life, cinematic digital distortion',
    params: '--ar 21:9 --stylize 400'
  },
  {
    id: 'kurosawa',
    name: 'Akira Kurosawa Inspired',
    description: 'Akira Kurosawa Inspired, Cinematic Photography, 35mm Film, Dramatic Aesthetic',
    thumbnail: 'https://picsum.photos/seed/kurosawa/800/450',
    prompt: 'style of Akira Kurosawa, Akira Kurosawa Inspired, Cinematic Photography, 35mm Film, Dramatic Aesthetic, epic samurai cinema, dynamic movement, geometric composition, nature as a character, Japanese aesthetic, high-contrast monochrome, dappled sunlight, dramatic weather effects, telephoto lens compression, low angle warrior perspective, 35mm film grain',
    params: '--ar 2.35:1 --stylize 300 --no modern, neon'
  },
  {
    id: 'gizem',
    name: 'Gizem Akdag Inspired',
    description: 'Gizem Akdag Style / Surrealist Photography, Liminal Space Aesthetic, Polarized Lens Effect / Harsh Lighting',
    thumbnail: 'https://picsum.photos/seed/gizem/800/450',
    prompt: 'style of Gizem Akdag, Gizem Akdag Inspired, Gizem Akdag Style / Surrealist Photography, Liminal Space Aesthetic, Polarized Lens Effect / Harsh Lighting, dreamlike atmosphere, unsettling stillness, vibrant but lonely colors, sharp shadows, cinematic surrealism',
    params: '--ar 4:3 --stylize 400'
  },
  {
    id: 'nolan',
    name: 'Nolan Inspired',
    description: 'Realistic photography style, Widescreen cinematic feel, Christopher Nolan style',
    thumbnail: 'https://picsum.photos/seed/nolan/800/450',
    prompt: 'style of Christopher Nolan, IMAX 70mm film aesthetic, epic scale, architectural, tactile realism, intellectual atmosphere, non-linear feeling, naturalistic lighting, cool color temperature, deep blues and slate grays, high contrast, dramatic shadows, wide-angle lens, sharp detail, massive depth of field',
    params: '--ar 2.39:1 --stylize 250 --no cartoon, vibrant colors'
  },
  {
    id: 'fincher_inspired',
    name: 'David Fincher Inspired',
    description: 'Documentary style, Low saturation, David Fincher style',
    thumbnail: 'https://picsum.photos/seed/fincher-inspired/800/450',
    prompt: 'style of David Fincher, digital perfection, analytical camera work, urban alienation, clinical aesthetics, ultra-sharp resolution, sickly yellow and green tint, low-key lighting, dimly lit interiors, fluorescent light glow, moody dark shadows, Red Epic Dragon sensor, Zeiss Master Prime lenses, high-shutter speed, no film grain, stabilized motion',
    params: '--ar 2.39:1 --style raw --stylize 200'
  },
  {
    id: 'villeneuve',
    name: 'Denis Villeneuve Inspired',
    description: 'Denis Villeneuve Inspired, Cinematic Still, Sci-Fi Photography, IMAX, Brutalism, Minimalist Sci-Fi',
    thumbnail: 'https://picsum.photos/seed/villeneuve/800/450',
    prompt: 'style of Denis Villeneuve, Denis Villeneuve Inspired, Cinematic Still, Sci-Fi Photography, IMAX, Brutalism, Minimalist Sci-Fi, Dune Style, Atmospheric, vast scale, monochromatic color palettes, atmospheric haze, deep shadows, sharp architectural lines, cinematic lighting',
    params: '--ar 2.39:1 --stylize 300'
  },
  {
    id: 'dead_poets',
    name: 'Dead Poets Society Inspired',
    description: 'Documentary style, Film grain, Dead Poets Society style',
    thumbnail: 'https://picsum.photos/seed/dead-poets/800/450',
    prompt: 'style of Dead Poets Society, Dead Poets Society Inspired, Documentary style, Film grain, Dead Poets Society style, nostalgic academic aesthetic, warm autumn colors, soft natural lighting, 35mm film texture, emotional realism, cinematic nostalgia',
    params: '--ar 1.85:1 --stylize 200'
  },
  {
    id: 'deltoro',
    name: 'Guillermo del Toro Inspired',
    description: 'Cinematic, Film Photography, Guillermo del Toro Style, Dark Fantasy, Gothic',
    thumbnail: 'https://picsum.photos/seed/deltoro/800/450',
    prompt: 'style of Guillermo del Toro, dark fantasy aesthetic, Gothic horror, Baroque detail, fairytale atmosphere, macabre beauty, teal and orange color grading, dramatic amber glow, deep cool blue shadows, high contrast, moody and misty, smooth camera movement, macro photography of textures, rich visual density',
    params: '--ar 1.85:1 --stylize 400 --no clean, minimalist'
  },
  {
    id: 'dali',
    name: 'Salvador Dalí Inspired',
    description: 'Dalí/Absurdist Aesthetic, Salvador Dalí Style / Surrealism, Classic Oil Painting',
    thumbnail: 'https://picsum.photos/seed/dali/800/450',
    prompt: 'style of Salvador Dalí, Salvador Dalí Inspired, Dalí/Absurdist Aesthetic, Salvador Dalí Style / Surrealism, Classic Oil Painting, melting objects, dream logic, vast desert landscapes, long shadows, sharp focus on impossible details, cinematic surrealism',
    params: '--ar 16:9 --stylize 500'
  },
  {
    id: 'fusion',
    name: 'Fincher-Scorsese-Villeneuve Cinematic Fusion',
    description: 'Cinematic MV Style, David Fincher Style, Martin Scorsese Style, Denis Villeneuve Style, IMAX 70mm, 35mm Grain, Industrial Realism, Minimalist Surrealism',
    thumbnail: 'https://picsum.photos/seed/fusion/800/450',
    prompt: 'Fincher-Scorsese-Villeneuve Cinematic Fusion, Cinematic MV Style, David Fincher Style, Martin Scorsese Style, Denis Villeneuve Style, IMAX 70mm, 35mm Grain, Industrial Realism, Minimalist Surrealism, high-contrast urban environments, clinical precision, visceral energy, vast atmospheric scale',
    params: '--ar 2.39:1 --stylize 300'
  },
  {
    id: 'dali_nolan_fusion',
    name: 'Dalí-Nolan Surreal Realism',
    description: 'Surrealist logic meets tactile realism. Impossible architecture, bending time, and sharp cinematic detail.',
    thumbnail: 'https://picsum.photos/seed/dali-nolan/800/450',
    prompt: 'Dalí-Nolan Surreal Realism Fusion, Salvador Dalí Surrealism, Christopher Nolan Tactile Realism, IMAX 70mm, impossible architecture, bending time, melting clocks in a clinical modern setting, high contrast, deep shadows, sharp focus, dream logic meets physical reality',
    params: '--ar 2.39:1 --stylize 450'
  },
  {
    id: 'kurosawa_villeneuve_fusion',
    name: 'Kurosawa-Villeneuve Epic Minimalism',
    description: 'Geometric samurai composition meets brutalist sci-fi scale. Dynamic movement in vast, silent landscapes.',
    thumbnail: 'https://picsum.photos/seed/kurosawa-villeneuve/800/450',
    prompt: 'Kurosawa-Villeneuve Epic Minimalism Fusion, Akira Kurosawa Geometric Composition, Denis Villeneuve Brutalist Sci-Fi, vast scale, atmospheric haze, dynamic movement, nature as a character, sharp architectural lines, monochromatic color palette with dramatic lighting',
    params: '--ar 2.39:1 --stylize 350'
  },
  {
    id: 'gen_aesthetics_deltoro_fusion',
    name: 'Generative Gothic Noir',
    description: 'Tech-noir glitch aesthetics merged with dark fantasy Baroque detail. Digital decay meets organic horror.',
    thumbnail: 'https://picsum.photos/seed/gen-gothic/800/450',
    prompt: 'Generative Gothic Noir Fusion, Generative Aesthetics, Guillermo del Toro Dark Fantasy, Tech Noir, Glitch Art, Baroque detail, digital decay, organic horror, teal and orange color grading, neon glitch overlays on gothic architecture, macabre beauty',
    params: '--ar 21:9 --stylize 400'
  },
  {
    id: 'scorsese',
    name: 'Martin Scorsese',
    description: 'Gritty realism, visceral, dynamic composition',
    thumbnail: 'https://picsum.photos/seed/scorsese/800/450',
    prompt: 'style of Martin Scorsese, gritty realism, visceral, dynamic composition, highly stylized, chiaroscuro lighting, dramatic high-contrast, deep shadows, stark highlights, neon red accents, 35mm film grain, Arriflex lens, anamorphic widescreen',
    params: '--ar 2.35:1 --style raw --stylize 250'
  },
  {
    id: 'fincher_scorsese_fusion',
    name: 'Fincher x Scorsese Fusion',
    description: 'La precisión clínica de Fincher con la energía dinámica de Scorsese.',
    thumbnail: 'https://picsum.photos/seed/fincher-scorsese/800/450',
    prompt: 'Fusion of David Fincher and Martin Scorsese styles, clinical precision meets high energy, dark urban atmosphere, smooth but dynamic camera movement, high contrast, gritty detail.',
    params: '--ar 16:9 --v 6.0'
  },
  {
    id: 'villeneuve_nolan_fusion',
    name: 'Villeneuve x Nolan Fusion',
    description: 'La atmósfera brutalista de Villeneuve con la escala épica de Nolan.',
    thumbnail: 'https://picsum.photos/seed/villeneuve-nolan/800/450',
    prompt: 'Fusion of Denis Villeneuve and Christopher Nolan styles, atmospheric brutalism, massive epic scale, IMAX look, muted but intense colors, practical realism.',
    params: '--ar 16:9 --v 6.0'
  },
  {
    id: 'anderson_dali_fusion',
    name: 'Anderson x Dalí Fusion',
    description: 'La simetría de Wes Anderson con el surrealismo onírico de Salvador Dalí.',
    thumbnail: 'https://picsum.photos/seed/anderson-dali/800/450',
    prompt: 'Fusion of Wes Anderson and Salvador Dalí styles, symmetrical surrealism, pastel dreamscape, melting objects in perfect composition, whimsical but bizarre, highly detailed.',
    params: '--ar 16:9 --v 6.0'
  },
  {
    id: 'cyberpunk_noir_fusion',
    name: 'Cyberpunk x Film Noir',
    description: 'Luces de neón futuristas con las sombras y el misterio del cine negro.',
    thumbnail: 'https://picsum.photos/seed/cyberpunk-noir/800/450',
    prompt: 'Cyberpunk meets Film Noir, neon lights in rainy dark streets, high contrast shadows, futuristic urban decay, smoke and mirrors, blue and pink neon against deep blacks.',
    params: '--ar 16:9 --v 6.0'
  },
  {
    id: 'anime_ghibli_fusion',
    name: 'Ghibli x Realism Fusion',
    description: 'La magia de Studio Ghibli con texturas y luz hiper-realistas.',
    thumbnail: 'https://picsum.photos/seed/ghibli-realism/800/450',
    prompt: 'Studio Ghibli aesthetic with hyper-realistic textures, lush green landscapes, magical atmosphere, soft cinematic lighting, detailed hand-drawn feel but with 8k realism.',
    params: '--ar 16:9 --v 6.0'
  },
  {
    id: 'welles',
    name: 'Orson Welles',
    description: 'Deep focus, Baroque visual style, Film Noir',
    prompt: 'style of Orson Welles, deep focus cinematography, Baroque visual style, Film Noir aesthetic, dramatic scale, theatrical composition, high-contrast black and white, chiaroscuro lighting, stark shadows, low-key lighting, atmospheric smoke and haze, low-angle worm\'s eye view, wide-angle lens distortion, 35mm vintage film grain',
    params: '--ar 4:3 --no color --stylize 450'
  },
  {
    id: 'fincher_classic',
    name: 'David Fincher',
    description: 'Digital perfection, analytical, urban alienation',
    prompt: 'style of David Fincher, digital perfection, analytical camera work, urban alienation, clinical aesthetics, ultra-sharp resolution, sickly yellow and green tint, low-key lighting, dimly lit interiors, fluorescent light glow, moody dark shadows, Red Epic Dragon sensor, Zeiss Master Prime lenses, high-shutter speed, no film grain, stabilized motion',
    params: '--ar 2.39:1 --style raw --stylize 200'
  },
  {
    id: 'cameron',
    name: 'James Cameron',
    description: 'Epic scale, technological realism, high-budget',
    prompt: 'style of James Cameron, epic scale, technological realism, high-budget action, underwater aesthetic, futuristic design, Cameron blue night lighting, cyan and teal tones, cinematic backlight, metallic reflections, bioluminescent glow, digital 3D fusion camera system, sharp focus, massive depth of field, clean visuals, no film grain',
    params: '--ar 2.39:1 --stylize 250 --v 6.0'
  },
  {
    id: 'coppola',
    name: 'Francis Ford Coppola',
    description: 'Operatic scale, classical Hollywood, epic tragedy',
    prompt: 'style of Francis Ford Coppola, operatic scale, classical Hollywood aesthetic, epic tragedy, rich visual textures, nostalgic and somber, low-key lighting, chiaroscuro, deep amber tones, shadowy eyes, golden hour indoor lighting, sepia undertones, 35mm film grain, Technovision anamorphic lenses, warm color grading',
    params: '--ar 1.85:1 --stylize 350 --v 6.0'
  },
  {
    id: 'bergman',
    name: 'Ingmar Bergman',
    description: 'Scandinavian minimalism, existential drama',
    prompt: 'style of Ingmar Bergman, Scandinavian minimalism, existential drama, psychological intimacy, stark and somber, raw human emotion, natural soft light, harsh winter light, high-contrast monochrome, dramatic shadows on faces, Scandinavian daylight, extreme close-up, 75mm lens aesthetic, 35mm film grain, deep focus',
    params: '--ar 1.66:1 --stylize 150 --no makeup, soft skin'
  },
  {
    id: 'scott',
    name: 'Ridley Scott',
    description: 'Atmospheric density, industrial aesthetic, gritty sci-fi',
    prompt: 'style of Ridley Scott, atmospheric density, industrial aesthetic, gritty sci-fi, epic historical realism, volumetric lighting, backlit smoke and haze, shafts of light, cinematic neon glow, high contrast, teal and orange color grading, anamorphic lenses, heavy lens flares, shallow depth of field, 35mm film grain',
    params: '--ar 2.39:1 --stylize 300 --no clean, simple'
  },
  {
    id: 'anderson',
    name: 'Wes Anderson',
    description: 'Symmetrical composition, diorama aesthetic',
    prompt: 'style of Wes Anderson, symmetrical composition, center-balanced, diorama aesthetic, storybook illustration style, quirky and whimsical, flat lighting, soft pastel tones, even illumination, no harsh shadows, wide-angle lens, planoview, 90-degree whip pan feeling, analogue film texture',
    params: '--ar 21:9 --stylize 250 --no shadows, realistic grit'
  },
  {
    id: 'lynch',
    name: 'David Lynch',
    description: 'Lynchian aesthetic, dreamlike surrealism',
    prompt: 'style of David Lynch, Lynchian aesthetic, dreamlike surrealism, unsettling atmosphere, neo-noir, absurdist visual style, high-contrast shadows, red room lighting, flickering neon, stark spotlights, moody and dark, soft focus edges, 35mm grainy film, distorted perspectives, slow-burn cinematography',
    params: '--ar 1.85:1 --stylize 400 --chaos 20'
  },
  {
    id: 'miller',
    name: 'George Miller',
    description: 'Kinetic action, post-apocalyptic dieselpunk',
    prompt: 'style of George Miller, kinetic action, post-apocalyptic dieselpunk, high-speed movement, visceral and tactile, over-the-top energy, high-saturation color grading, orange and teal contrast, harsh desert sunlight, electric blue night aesthetic, center-weighted composition, wide-angle lens, high-shutter speed, 35mm film grain',
    params: '--ar 2.39:1 --stylize 300 --no boring, dull colors'
  },
  {
    id: 'aster',
    name: 'Ari Aster',
    description: 'Elevated horror, clinical and bright, pastoral folk',
    prompt: 'style of Ari Aster, elevated horror aesthetic, clinical and bright, pastoral folk horror, symmetrical composition, unsettling beauty, high-key sunlight, overexposed bright day, soft diffused natural light, warm amber interiors, stark and clean, wide-angle deep focus, slow-zoom perspective, sharp cinematic textures, Arri Alexa LF look',
    params: '--ar 2:1 --stylize 200 --no dark shadows, foggy'
  },
  {
    id: 'carpenter',
    name: 'John Carpenter',
    description: 'Anamorphic widescreen, 80s synth-horror',
    prompt: 'style of John Carpenter, anamorphic widescreen, 80s synth-horror aesthetic, low-budget high-tension, minimalist composition, atmospheric suspense, blue moonlight, high-contrast ink-black shadows, rim lighting, anamorphic blue lens flares, stark silhouettes, Panavision lenses, steady-cam POV, wide-angle depth, 35mm vintage film grain',
    params: '--ar 2.39:1 --stylize 200 --no modern, digital clean'
  },
  {
    id: 'almodovar',
    name: 'Pedro Almodóvar',
    description: 'Spanish kitsch, vibrant pop-art design',
    prompt: 'style of Pedro Almodóvar, Almodovarian aesthetic, Spanish kitsch, vibrant pop-art design, theatrical melodrama, hyper-saturated color palette, bright saturated lighting, high-key color contrast, vivid shadows, glamorous and polished look, top-down flat lay photography, medium close-up, 35mm vibrant film stock, sharp focus on textures',
    params: '--ar 1.85:1 --stylize 300 --no muted colors, dull, dark shadows'
  },
  {
    id: 'cuaron',
    name: 'Alfonso Cuarón',
    description: 'Immersive long take, wide-angle deep focus',
    prompt: 'style of Alfonso Cuarón, immersive long take, wide-angle deep focus, cinematic realism, spatial awareness, documentary-style fluidity, natural lighting, high dynamic range, soft daylight, volumetric lighting, wide-angle lens, Arri Alexa 65, sharp digital texture, uninterrupted perspective',
    params: '--ar 2.39:1 --stylize 150 --no bokeh'
  },
  {
    id: 'burton',
    name: 'Tim Burton',
    description: 'Gothic revival, German Expressionism, whimsical',
    prompt: 'style of Tim Burton, Gothic revival aesthetic, German Expressionism, whimsical but dark, twisted architecture, eerie fairytale, high-contrast shadows, moody moonlight, stark lighting, vibrant accents in dark settings, misty and foggy, Dutch angle, wide-angle distortion, hand-crafted textures, cinematic film grain',
    params: '--ar 1.85:1 --stylize 400 --no realistic, modern office'
  },
  {
    id: 'park',
    name: 'Park Chan-wook',
    description: 'Neo-noir Korean cinema, baroque aesthetic',
    prompt: 'style of Park Chan-wook, neo-noir Korean cinema, baroque aesthetic, violent elegance, meticulous symmetry, darkly poetic, vibrant jewel tones, moody high-contrast, wet textures, dramatic spotlights, cinematic neon accents, wide-angle lens, macro photography of textures, deep focus, Arri Alexa cinematic look',
    params: '--ar 2.39:1 --stylize 350 --no messy, blurry'
  },
  {
    id: 'kobayashi',
    name: 'Masaki Kobayashi',
    description: 'Geometric formalism, Japanese cinematic minimalism',
    prompt: 'style of Masaki Kobayashi, geometric formalism, Japanese cinematic minimalism, stark and severe, samurai tragedy, architectural framing, high-contrast monochrome, Sumi-e ink aesthetic, stark highlights, harsh shadows, wide-angle lens, deep depth of field, 35mm film grain, static and precise composition',
    params: '--ar 2.39:1 --stylize 300 --no messy, blurred lines'
  }
];

export const CAMERA_MOVEMENTS = [
  { id: 'dolly_zoom', name: 'Dolly Zoom (Vertigo)', prompt: 'Dolly zoom effect, background distorts while subject stays fixed' },
  { id: 'low_angle_trunk', name: 'Low-Angle Trunk Shot', prompt: 'Ultra low-angle from inside a dark car trunk looking up' },
  { id: 'one_point', name: 'One-Point Perspective', prompt: 'One-point perspective, perfectly symmetrical, vanishing point in center' },
  { id: 'double_dolly', name: 'Double Dolly', prompt: 'Double dolly shot, character glides without walking, floating motion' },
  { id: 'dutch_angle', name: 'Dutch Angle', prompt: 'Dutch angle, tilted horizon, dramatic diagonal composition' },
  { id: 'snorricam', name: 'SnorriCam', prompt: 'SnorriCam, camera mounted to actor facing their face, background bounces' },
  { id: 'whip_pan', name: 'Whip Pan', prompt: 'Fast 90-degree whip pan, motion blur transition' },
  { id: 'birds_eye', name: 'Bird\'s Eye View', prompt: 'Top-down bird\'s eye view, looking straight down at the scene' },
  { id: 'steadicam', name: 'Steadicam Long Take', prompt: 'Continuous Steadicam tracking shot, fluid movement' },
  { id: 'hero_orbit', name: 'Hero Orbit (360)', prompt: 'Fast 360-degree camera orbit, low angle, heroic action feeling' },
  { id: 'speed_ramp', name: 'Speed Ramp', prompt: 'Speed ramp, extreme slow motion transitions into fast motion' },
  { id: 'macro_eye', name: 'Extreme Close-up Macro', prompt: 'Macro extreme close-up of eyes, intense focus' },
  { id: 'vertigo_spin', name: 'Vertigo Spin', prompt: 'Slow 180-degree camera roll, world turns upside down' },
  { id: 'shaky_cam', name: 'Handheld Shaky Cam', prompt: 'Handheld shaky cam, jittery movement, frantic documentary style' },
  { id: 'crash_zoom', name: 'Crash Zoom', prompt: 'Sudden violent crash zoom into a character\'s face' },
  { id: 'over_shoulder', name: 'Over-the-shoulder', prompt: 'Over-the-shoulder shot, shallow depth of field' },
  { id: 'profile_silhouette', name: 'Profile Silhouette', prompt: 'Side profile silhouette, heavy backlighting' },
  { id: 'worms_eye', name: 'Worm\'s Eye View', prompt: 'Worm\'s eye view, camera on ground level looking up' },
  { id: 'pan_tilt_lock', name: 'Pan and Tilt Lock', prompt: 'Mechanical pan and tilt, perfectly smooth tripod movement, robotic precision' },
  { id: 'slow_push_in', name: 'Slow Push-In', prompt: 'Slow cinematic push-in towards a face, emotional revelation' },
  { id: 'drone_sweep', name: 'Drone Sweep', prompt: 'Sweeping drone shot, massive scale, flying over landscape' },
  { id: 'fisheye', name: 'Fisheye Lens', prompt: 'Fisheye lens distortion, curved edges, surreal perspective' }
];

export const VIDEO_TYPES = [
  { id: 'performance', name: 'Performance', description: 'Focuses on the artist/band performing.' },
  { id: 'narrative', name: 'Narrative', description: 'Tells a story with a beginning, middle, and end.' },
  { id: 'conceptual', name: 'Conceptual', description: 'Abstract, symbolic, and surreal visual metaphors.' }
];

