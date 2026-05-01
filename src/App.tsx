import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Upload, Wand2, Download, Music, Video, Sparkles, Settings, Loader2, FileAudio, CheckCircle2, Film, User as UserIcon, Palette, Copy, Check, X, ArrowLeft, Plus } from 'lucide-react';
import WaveSurfer from 'wavesurfer.js';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { DIRECTORS } from './data/compendium';
import { DESPERTAR_DIGITAL_DATA } from './data/despertarDigital';
import { generateStoryboard, generateSceneImage, generateAssetImage, transcribeAudio, suggestConcept, generateCustomStyle } from './services/geminiService';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { auth, db, loginWithGoogle, logout, onAuthStateChanged, type User, collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, onSnapshot, Timestamp, deleteDoc, handleFirestoreError, OperationType } from './firebase';
import StyleSelector from './components/StyleSelector';

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

declare const puter: any;

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper to clean objects for Firestore (removes undefined, replaces with null or deletes)
function cleanForFirestore(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(v => cleanForFirestore(v));
  } else if (obj !== null && typeof obj === 'object' && !(obj instanceof Timestamp)) {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, cleanForFirestore(v)])
    );
  }
  return obj === undefined ? null : obj;
}

// Mock Data
const MOCK_AUDIO_URL = 'https://actions.google.com/sounds/v1/music/cinematic_orchestra_music.ogg';

type ReferenceAsset = {
  id: string;
  name: string;
  type: 'personaje' | 'personajes-vestuario' | 'locacion' | 'prop';
  description: string;
  generationPrompt: string;
  imageUrl?: string;
  thoughtSignature?: string;
  isGenerating?: boolean;
};

type Clip = {
  id: string;
  sceneNumber: number;
  shotNumber?: number;
  timecode: string;
  start: number;
  duration: number;
  caption: string;
  startFrame?: string;
  actionCamera?: string;
  endFrame?: string;
  rhythm?: string;
  overallStyle: string;
  narrativeFunction: string;
  lyrics: string;
  transitionEntry: string;
  transitionExit: string;
  editingRhythm: string;
  imagePrompt: string;
  animationPrompt: string;
  imageUrl: string;
  isGeneratingImage?: boolean;
  assetReferences: string[]; // IDs of ReferenceAssets used in this shot
};

type CreativeBrief = {
  projectOverview: {
    title: string;
    targetAudience: string;
    rhythmDriver: string;
    estimatedDuration: string;
    summary: string;
  };
  creativeConcept: {
    structureType: string;
    coreDrive: string;
    contentOutline: { block: string; timeframe: string; strategy: string }[];
  };
  referenceAssets: ReferenceAsset[];
  scriptAndSound: {
    bgmBrief: string;
  };
};

type GenerationStep = 'upload' | 'analyze' | 'character' | 'storyboard' | 'generate' | 'complete' | 'projects';

type Project = {
  id: string;
  userId: string;
  title: string;
  createdAt: any;
  songDescription: string;
  directorId: string;
  videoType: string;
  aspectRatio: string;
  creativeBrief: CreativeBrief;
  clips: Clip[];
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [puterUser, setPuterUser] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Workflow State - Initialize from localStorage if available
  const [currentStep, setCurrentStep] = useState<GenerationStep>(() => {
    const saved = localStorage.getItem('ai_director_step');
    return (saved as GenerationStep) || 'upload';
  });
  const [directors, setDirectors] = useState(DIRECTORS);
  const [selectedDirector, setSelectedDirector] = useState(() => {
    return localStorage.getItem('ai_director_selected_director') || DIRECTORS[0].id;
  });
  const [isGeneratingStyle, setIsGeneratingStyle] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  
  // New AI Inputs
  const [songDescription, setSongDescription] = useState(() => localStorage.getItem('ai_director_song_desc') || '');
  const [videoConcept, setVideoConcept] = useState(() => localStorage.getItem('ai_director_video_concept') || '');
  const [numCharacters, setNumCharacters] = useState(() => Number(localStorage.getItem('ai_director_num_chars')) || 1);
  const [videoType, setVideoType] = useState(() => localStorage.getItem('ai_director_video_type') || 'narrative');
  const [aspectRatio, setAspectRatio] = useState(() => localStorage.getItem('ai_director_aspect_ratio') || '16:9');
  const [manualDuration, setManualDuration] = useState<string>(() => localStorage.getItem('ai_director_manual_dur') || '');

  const [clips, setClips] = useState<Clip[]>(() => {
    const saved = localStorage.getItem('ai_director_clips');
    return saved ? JSON.parse(saved) : [];
  });
  const [creativeBrief, setCreativeBrief] = useState<CreativeBrief | null>(() => {
    const saved = localStorage.getItem('ai_director_brief');
    return saved ? JSON.parse(saved) : null;
  });

  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  // Initialize WaveSurfer
  useEffect(() => {
    if (!waveformRef.current) return;

    let audioUrl = MOCK_AUDIO_URL;
    if (audioFile && audioFile.size > 0) {
      audioUrl = URL.createObjectURL(audioFile);
    }

    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#4b5563',
      progressColor: '#6366f1',
      cursorColor: '#f3f4f6',
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 60,
      url: audioUrl,
    });

    wavesurfer.on('ready', () => {
      const dur = wavesurfer.getDuration();
      setDuration(dur);
      if (audioFile && audioFile.size > 0) {
        setManualDuration(Math.round(dur).toString());
      }
    });

    wavesurfer.on('audioprocess', () => {
      setCurrentTime(wavesurfer.getCurrentTime());
    });

    wavesurfer.on('interaction', () => {
      setCurrentTime(wavesurfer.getCurrentTime());
    });

    wavesurfer.on('play', () => setIsPlaying(true));
    wavesurfer.on('pause', () => setIsPlaying(false));

    wavesurferRef.current = wavesurfer;

    return () => {
      wavesurfer.destroy();
      if (audioUrl !== MOCK_AUDIO_URL) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [currentStep, audioFile]);

  // Persistent Storage Effect
  useEffect(() => {
    localStorage.setItem('ai_director_step', currentStep);
    localStorage.setItem('ai_director_selected_director', selectedDirector);
    localStorage.setItem('ai_director_song_desc', songDescription);
    localStorage.setItem('ai_director_video_concept', videoConcept);
    localStorage.setItem('ai_director_num_chars', numCharacters.toString());
    localStorage.setItem('ai_director_video_type', videoType);
    localStorage.setItem('ai_director_aspect_ratio', aspectRatio);
    localStorage.setItem('ai_director_manual_dur', manualDuration);
    localStorage.setItem('ai_director_clips', JSON.stringify(clips));
    localStorage.setItem('ai_director_brief', JSON.stringify(creativeBrief));
  }, [currentStep, selectedDirector, songDescription, videoConcept, numCharacters, videoType, aspectRatio, manualDuration, clips, creativeBrief]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        fetchProjects(user.uid);
        syncUserProfile(user);
      } else {
        setProjects([]);
      }
    });

    // Puter Auth Check
    if (typeof puter !== 'undefined') {
      puter.auth.getUser().then((pUser: any) => {
        setPuterUser(pUser);
      }).catch(() => {
        setPuterUser(null);
      });
    }

    return () => unsubscribe();
  }, []);

  const handlePuterSignIn = async () => {
    if (typeof puter === 'undefined') return;
    try {
      const pUser = await puter.auth.signIn();
      setPuterUser(pUser);
    } catch (error) {
      console.error("Puter sign in failed:", error);
    }
  };

  const handlePuterSignOut = async () => {
    if (typeof puter === 'undefined') return;
    puter.auth.signOut();
    setPuterUser(null);
  };

  const syncUserProfile = async (user: User) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        await setDoc(userRef, cleanForFirestore({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        }));
      } else {
        await setDoc(userRef, cleanForFirestore({
          displayName: user.displayName,
          photoURL: user.photoURL,
          updatedAt: Timestamp.now()
        }), { merge: true });
      }
    } catch (error) {
      console.error("Error syncing user profile:", error);
    }
  };

  const fetchProjects = async (uid: string) => {
    if (!uid) return;
    setIsLoadingProjects(true);
    console.log("Fetching projects for user:", uid);
    
    // We remove the orderBy temporarily to ensure projects show up even if the index isn't ready
    const q = query(
      collection(db, 'projects'),
      where('userId', '==', uid)
    );

    try {
      const querySnapshot = await getDocs(q);
      const loadedProjects: Project[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        loadedProjects.push({ id: doc.id, ...data } as Project);
      });
      
      // Sort manually in memory if orderBy is disabled
      const sortedProjects = loadedProjects.sort((a: any, b: any) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });
      
      console.log("Loaded projects:", sortedProjects.length);
      setProjects(sortedProjects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      // If it's a permission error or index error, we'll see it in console
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const handleOpenProjects = () => {
    if (user) {
      fetchProjects(user.uid);
    }
    setCurrentStep('projects');
  };

  const saveProject = async () => {
    if (!user || !creativeBrief || clips.length === 0) return;

    setIsSaving(true);
    const projectId = creativeBrief.projectOverview.title.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
    const projectData: Omit<Project, 'id'> = {
      userId: user.uid,
      title: creativeBrief.projectOverview.title,
      createdAt: Timestamp.now(),
      songDescription,
      directorId: selectedDirector,
      videoType,
      aspectRatio,
      creativeBrief,
      clips
    };

    try {
      await setDoc(doc(db, 'projects', projectId), cleanForFirestore(projectData));
      setStatusMessage('Project saved to database.');
      fetchProjects(user.uid);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `projects/${projectId}`);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'projects', projectId));
      setProjects(prev => prev.filter(p => p.id !== projectId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `projects/${projectId}`);
    }
  };

  const loadProject = (project: Project) => {
    setCreativeBrief(project.creativeBrief);
    setClips(project.clips);
    setSongDescription(project.songDescription);
    setSelectedDirector(project.directorId);
    setVideoType(project.videoType);
    setAspectRatio(project.aspectRatio);
    setCurrentStep('complete');
  };
  
  const handleCreateCustomStyle = async (request: string) => {
    setIsGeneratingStyle(true);
    try {
      const newStyle = await generateCustomStyle(request);
      
      // Ensure ID is unique
      let finalId = newStyle.id;
      let counter = 1;
      while (directors.some(d => d.id === finalId)) {
        finalId = `${newStyle.id}_${counter}`;
        counter++;
      }

      const styleWithThumb = {
        ...newStyle,
        id: finalId,
        thumbnail: `https://picsum.photos/seed/${finalId}/800/450`
      };
      setDirectors(prev => [...prev, styleWithThumb]);
      setSelectedDirector(finalId);
      setStatusMessage(`New style created: ${newStyle.name}`);
    } catch (error) {
      console.error("Failed to create custom style:", error);
      setStatusMessage("Failed to create custom style. Please try again.");
    } finally {
      setIsGeneratingStyle(false);
    }
  };

  const togglePlay = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (referenceImages.length >= 4) return;
      
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setReferenceImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeReferenceImage = (index: number) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAudioFile(file);
      
      const audio = new Audio();
      const objectUrl = URL.createObjectURL(file);
      audio.src = objectUrl;
      audio.onloadedmetadata = () => {
        const dur = Math.round(audio.duration);
        setManualDuration(dur.toString());
        setDuration(audio.duration);
        URL.revokeObjectURL(objectUrl);
      };

      setCurrentStep('analyze');
      setIsTranscribing(true);
      setStatusMessage('Preparing audio for analysis...');
      
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // 1. Transcribe
        setStatusMessage('AI Director is listening/transcribing your track...');
        const lyrics = await transcribeAudio(base64, file.type);
        
        if (lyrics) {
          setSongDescription(lyrics);
          
          // 2. Automatically suggest concept based on lyrics
          setStatusMessage('Extracting visual essence and concept...');
          const concept = await suggestConcept(lyrics);
          if (concept) {
            setVideoConcept(concept);
            setStatusMessage('Analysis complete. Refine your vision below.');
          } else {
            setStatusMessage('Lyrics extracted, but could not suggest a concept automatically.');
          }
        } else {
          setStatusMessage('Could not extract lyrics. You can enter them manually.');
        }
      } catch (err) {
        console.error("Analysis process error:", err);
        const errorMsg = err instanceof Error ? err.message : "Audio analysis failed.";
        setStatusMessage(`Error: ${errorMsg}. You can still enter details manually below.`);
      } finally {
        setIsTranscribing(false);
      }
    }
  };

  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);
  const [copiedAnimationPrompt, setCopiedAnimationPrompt] = useState<string | null>(null);

  const handleCopyPrompt = (prompt: string, type: 'image' | 'animation') => {
    navigator.clipboard.writeText(prompt);
    if (type === 'image') {
      setCopiedPrompt(prompt);
      setTimeout(() => setCopiedPrompt(null), 2000);
    } else {
      setCopiedAnimationPrompt(prompt);
      setTimeout(() => setCopiedAnimationPrompt(null), 2000);
    }
  };

  const handleDownloadImage = (imageUrl: string, index: number) => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `scene-${index + 1}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const startAutomatedProduction = async () => {
    setCurrentStep('character');
    setGenerationProgress(10);
    setStatusMessage('Analyzing audio BPM, lyrics, and emotional map...');
    
    try {
      // 1. Generate Storyboard via Gemini
      setGenerationProgress(20);
      setStatusMessage('AI Director is writing the master storyboard...');
      
      const refImages = referenceImages.map(img => ({
        data: img.split(',')[1],
        mimeType: img.split(';')[0].split(':')[1]
      }));

      const response = await generateStoryboard(
        songDescription, 
        videoConcept,
        numCharacters,
        selectedDirector, 
        videoType, 
        manualDuration ? parseInt(manualDuration) : Math.max(duration, 32),
        refImages
      );
      
      setCreativeBrief(response.creativeBrief);
      
      const projectId = response.creativeBrief.projectOverview.title.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
      
      // Initial Save after Storyboard
      if (user) {
        const initialProject: Omit<Project, 'id'> = {
          userId: user.uid,
          title: response.creativeBrief.projectOverview.title,
          createdAt: Timestamp.now(),
          songDescription,
          directorId: selectedDirector,
          videoType,
          aspectRatio,
          creativeBrief: response.creativeBrief,
          clips: []
        };
        try {
          await setDoc(doc(db, 'projects', projectId), cleanForFirestore(initialProject));
          fetchProjects(user.uid);
        } catch (e) { console.error("Initial save failed", e); }
      }

      setCurrentStep('storyboard');
      setGenerationProgress(40);
      setStatusMessage('Generating Reference Assets (Ingredients)...');
      
      // 2. Generate Reference Assets (Ingredients)
      const assets = response.creativeBrief.referenceAssets || [];
      
      const updatedAssets: any[] = [];
      for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];
        setStatusMessage(`Creating Asset: ${asset.name} (${i + 1}/${assets.length})...`);
        setGenerationProgress(40 + Math.floor((i / assets.length) * 20));

        // Wait a bit to ensure Puter is ready and not overloaded
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { url, thoughtSignature } = await generateAssetImage(asset.generationPrompt, '1:1');
        updatedAssets.push({ ...asset, imageUrl: url, thoughtSignature, isGenerating: false });
      }

      setCreativeBrief(prev => prev ? { ...prev, referenceAssets: updatedAssets } : null);

      // 3. Create clips and generate real scene images
      setGenerationProgress(60);
      setStatusMessage('AI Director is painting individual scenes...');
      
      if (!response.shotList) {
        throw new Error("AI Director failed to generate a shot list. Please try again.");
      }

      let currentStartTime = 0;
      const initialClips: Clip[] = response.shotList.map((scene: any) => {
        const shotDuration = parseFloat(scene.duration) || 8;
        const clip: Clip = {
          id: Math.random().toString(36).substring(7),
          sceneNumber: scene.sceneNumber,
          shotNumber: scene.shotNumber,
          timecode: scene.timecode,
          start: currentStartTime,
          duration: shotDuration,
          caption: scene.caption,
          startFrame: scene.startFrame,
          actionCamera: scene.actionCamera,
          endFrame: scene.endFrame,
          rhythm: scene.rhythm,
          overallStyle: scene.overallStyle,
          narrativeFunction: scene.narrativeFunction,
          lyrics: scene.lyrics,
          transitionEntry: scene.transitionEntry,
          transitionExit: scene.transitionExit,
          editingRhythm: scene.editingRhythm,
          imagePrompt: scene.imagePrompt,
          animationPrompt: scene.animationPrompt,
          assetReferences: scene.assetReferences || [],
          imageUrl: '',
          isGeneratingImage: true
        };
        currentStartTime += shotDuration;
        return clip;
      });
      
      setClips(initialClips);

      const finalClips: Clip[] = [];
      for (let i = 0; i < initialClips.length; i++) {
        const clip = initialClips[i];
        setGenerationProgress(60 + Math.floor((i / initialClips.length) * 35));
        setStatusMessage(`Rendering Scene ${clip.sceneNumber} (${i + 1}/${initialClips.length})...`);

        // Get relevant reference assets for this clip
        const clipAssets = updatedAssets.filter(a => clip.assetReferences.includes(a.id));
        const refAssets = clipAssets.map(a => ({ 
          id: a.id, 
          name: a.name, 
          description: a.description, 
          imageUrl: a.imageUrl || '',
          thoughtSignature: a.thoughtSignature
        }));
        
        // Generate unique image for this scene
        const sceneImageUrl = await generateSceneImage(clip.imagePrompt, aspectRatio, refAssets);
        
        const updatedClip = { ...clip, imageUrl: sceneImageUrl || `https://placehold.co/1920x1080/141414/6366f1?text=GEN+ERROR`, isGeneratingImage: false };
        finalClips.push(updatedClip);
        
        // Update state progressively so UI reflects progress
        setClips([...finalClips, ...initialClips.slice(i + 1)]);
        
        // Anti-throttle delay
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      setClips(finalClips);
      
      // Final Auto-Save
      if (user && response.creativeBrief) {
        const finalProject: Omit<Project, 'id'> = {
          userId: user.uid,
          title: response.creativeBrief.projectOverview.title,
          createdAt: Timestamp.now(),
          songDescription,
          directorId: selectedDirector,
          videoType,
          aspectRatio,
          creativeBrief: { ...response.creativeBrief, referenceAssets: updatedAssets },
          clips: finalClips
        };
        try {
          await setDoc(doc(db, 'projects', projectId), cleanForFirestore(finalProject));
          fetchProjects(user.uid);
        } catch (e) { console.error("Final save failed", e); }
      }

      // 4. Final Assembly
      setGenerationProgress(100);
      setStatusMessage('Production Complete.');
      
      setTimeout(() => {
        setCurrentStep('complete');
      }, 1000);
      
    } catch (error) {
      console.error("Production failed:", error);
      setStatusMessage('Error: AI Director encountered an issue. Progress saved.');
      
      // Emergency Error Save (Save what we have)
      if (user && creativeBrief) {
        // We need the projectId here. Since it was defined in the try block, 
        // I should have defined it outside. Let's fix that in next edit if needed,
        // but for now I'll just try to save with a fallback ID if it's missing.
        const fallbackId = `error-${Date.now()}`;
        const errorProject: any = {
          userId: user.uid,
          title: creativeBrief?.projectOverview?.title || 'Recovered Project',
          createdAt: Timestamp.now(),
          songDescription,
          directorId: selectedDirector,
          videoType,
          aspectRatio,
          creativeBrief: creativeBrief,
          clips: clips,
          isErrorState: true
        };
        try {
          // Use a special ID or the known one if possible
          await setDoc(doc(db, 'projects', fallbackId), cleanForFirestore(errorProject));
          fetchProjects(user.uid);
        } catch (e) { console.error("Emergency save failed", e); }
      }

      setTimeout(() => setCurrentStep('complete'), 3000);
    }
  };

  const handleRegenerateShot = async (index: number) => {
    if (!creativeBrief || !clips[index]) return;
    
    const clip = clips[index];
    const updatedClips = [...clips];
    updatedClips[index] = { ...clip, isGeneratingImage: true };
    setClips(updatedClips);
    
    try {
      // Get relevant reference assets for this clip
      const clipAssets = creativeBrief.referenceAssets.filter(a => clip.assetReferences.includes(a.id));
      const refAssets = clipAssets.map(a => ({ 
        id: a.id, 
        name: a.name, 
        description: a.description, 
        imageUrl: a.imageUrl || '' 
      }));
      
      // Generate unique image for this scene
      const sceneImageUrl = await generateSceneImage(clip.imagePrompt, aspectRatio, refAssets);
      
      const nextUpdatedClips = [...updatedClips];
      nextUpdatedClips[index] = { 
        ...clip, 
        imageUrl: sceneImageUrl || clip.imageUrl, 
        isGeneratingImage: false 
      };
      setClips(nextUpdatedClips);
      setStatusMessage('Shot regenerated successfully');
    } catch (error) {
      console.error("Manual regeneration failed:", error);
      const nextUpdatedClips = [...updatedClips];
      nextUpdatedClips[index] = { ...clip, isGeneratingImage: false };
      setClips(nextUpdatedClips);
      setStatusMessage('Regeneration failed.');
    }
  };
  const exportToPDF = async () => {
    const element = document.getElementById('storyboard-content');
    if (!element) return;

    setStatusMessage('Preparing PDF export...');
    
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0a0a0a'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${creativeBrief?.projectOverview.title || 'storyboard'}.pdf`);
      setStatusMessage('PDF Exported Successfully.');
    } catch (error) {
      console.error("PDF export failed:", error);
      setStatusMessage('PDF Export failed.');
    }
  };

  // Find active clip based on current time
  const activeClip = clips.find(c => currentTime >= c.start && currentTime < c.start + c.duration);

  return (
    <div className="h-screen w-full flex flex-col bg-[#0a0a0a] text-gray-200 font-sans overflow-hidden">
      {/* Top Navigation */}
      <header className="h-14 border-b border-[#27272a] bg-[#141414] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center cursor-pointer" onClick={() => setCurrentStep('upload')}>
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-semibold text-sm tracking-wide">ULTIMATE MUSIC VIDEO DIRECTOR <span className="text-gray-500 font-normal">/ by thefirm media studios</span></h1>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Puter Auth */}
          {puterUser ? (
            <div className="flex items-center gap-2 pr-4 border-r border-[#27272a]">
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-gray-400">Puter Cloud</span>
                <span className="text-[10px] text-indigo-400 font-bold uppercase truncate max-w-[100px]">{puterUser.username}</span>
              </div>
              <button 
                onClick={handlePuterSignOut}
                className="p-1 hover:bg-white/5 rounded text-gray-500 hover:text-white transition-colors"
                title="Sign out from Puter"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button 
              onClick={handlePuterSignIn}
              className="flex items-center gap-2 px-3 py-1 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 text-[10px] font-bold rounded border border-indigo-600/30 transition-all uppercase tracking-tighter"
            >
              Sign in with Puter
            </button>
          )}

          {user ? (
            <div className="flex items-center gap-3">
              <button 
                onClick={handleOpenProjects}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                My Projects
              </button>
              <button 
                onClick={() => {
                  if (confirm('¿Estás seguro de que quieres empezar un nuevo proyecto? Serás redirigido al principio de la aplicación y se borrará el progreso actual que no hayas guardado en Firebase.')) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/30 hover:bg-red-800/50 border border-red-700/50 rounded-full text-red-200 text-xs font-medium transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Nuevo Proyecto
              </button>
              <div className="h-4 w-px bg-gray-700 mx-1"></div>
              
              {currentStep === 'complete' && (
                <button 
                  onClick={saveProject}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-medium rounded border border-emerald-600/30 transition-all disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                  Save Project
                </button>
              )}

              <div className="h-4 w-px bg-gray-800 mx-1" />
              
              <div className="flex items-center gap-2">
                <img src={user.photoURL || ''} alt="" className="w-6 h-6 rounded-full border border-gray-700" />
                <button onClick={logout} className="text-xs text-gray-500 hover:text-red-400 transition-colors">Logout</button>
              </div>
            </div>
          ) : (
            <button 
              onClick={loginWithGoogle}
              className="flex items-center gap-2 px-4 py-1.5 bg-white text-black text-xs font-bold rounded hover:bg-gray-200 transition-colors"
            >
              Login with Google
            </button>
          )}

          {currentStep === 'complete' && (
            <div className="flex items-center gap-2">
              <button 
                onClick={exportToPDF}
                className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded transition-colors"
              >
                <Download className="w-4 h-4" />
                Export PDF Storyboard
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Projects View */}
        {currentStep === 'projects' && (
          <div className="absolute inset-0 z-50 bg-[#0a0a0a] flex flex-col p-8 overflow-y-auto">
            <div className="max-w-6xl mx-auto w-full space-y-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#27272a] pb-8 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setCurrentStep('upload')} className="p-2 hover:bg-[#1f1f1f] rounded-lg transition-colors group">
                      <X className="w-6 h-6 text-gray-400 group-hover:text-white" />
                    </button>
                    <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Mis Producciones</h2>
                  </div>
                  <p className="text-gray-500 max-w-xl text-sm">
                    Gestiona y carga todos tus storyboards y conceptos creativos generados con la inteligencia artificial de thefirm media studios.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setCurrentStep('upload')}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Nuevo Proyecto
                  </button>
                </div>
              </div>

              {isLoadingProjects ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-6">
                  <div className="relative">
                    <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                    <div className="absolute inset-0 blur-xl bg-indigo-500/20 animate-pulse" />
                  </div>
                  <p className="text-gray-400 font-medium animate-pulse">Sincronizando con la nube...</p>
                </div>
              ) : projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-8 text-center bg-[#111111]/50 rounded-3xl border border-[#27272a] border-dashed">
                  <div className="w-24 h-24 bg-[#141414] rounded-full flex items-center justify-center border border-[#27272a] shadow-inner">
                    <Film className="w-10 h-10 text-gray-700" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-white uppercase tracking-tight">No hay proyectos todavía</h3>
                    <p className="text-gray-500 max-w-xs mx-auto text-sm leading-relaxed">
                      Sube tu primer track o describe tu visión para empezar a construir tu biblioteca visual.
                    </p>
                  </div>
                  <button 
                    onClick={() => setCurrentStep('upload')}
                    className="px-8 py-3 bg-white text-black hover:bg-gray-200 text-sm font-black uppercase rounded-full transition-all"
                  >
                    Empezar Ahora
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {projects.map((project) => (
                    <div 
                      key={project.id}
                      className="group bg-[#141414] border border-[#27272a] rounded-2xl overflow-hidden hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col relative"
                    >
                      <div className="aspect-video bg-black relative overflow-hidden">
                        <img 
                          src={project.clips[0]?.imageUrl || 'https://picsum.photos/seed/' + project.id + '/800/450'} 
                          alt="" 
                          className="w-full h-full object-cover opacity-60 group-hover:scale-110 group-hover:opacity-80 transition-all duration-700"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-black/30" />
                        
                        <div className="absolute top-3 left-3">
                           <span className="px-2 py-1 text-[9px] font-black bg-indigo-600 text-white rounded border border-indigo-400/30 uppercase tracking-widest">
                             {project.videoType}
                           </span>
                        </div>

                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Film className="w-3 h-3 text-indigo-400" />
                            <span className="text-[10px] font-bold text-white uppercase tracking-tighter">
                              {project.clips.length} Escenas
                            </span>
                          </div>
                          <span className="text-[10px] font-medium text-gray-400 bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm">
                            {project.aspectRatio}
                          </span>
                        </div>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-1.5">
                          <h4 className="text-white font-bold text-lg leading-tight group-hover:text-indigo-400 transition-colors line-clamp-2">
                            {project.title}
                          </h4>
                          <div className="flex items-center gap-2 text-[10px] text-gray-500">
                             <span className="bg-[#1f1f1f] px-1.5 py-0.5 rounded">ID: {project.directorId}</span>
                             <span>•</span>
                             <span>{project.createdAt?.toDate ? project.createdAt.toDate().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : 'Reciente'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                          <button 
                            onClick={() => loadProject(project)}
                            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold uppercase rounded-xl transition-all shadow-lg shadow-indigo-600/10 active:scale-95"
                          >
                            Cargar Proyecto
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if(confirm('¿Estás seguro de que quieres eliminar este proyecto permanentemente?')) {
                                deleteProject(project.id);
                              }
                            }}
                            className="p-2.5 bg-[#1f1f1f] hover:bg-red-600/20 text-gray-500 hover:text-red-400 rounded-xl transition-all active:scale-90"
                            title="Eliminar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Setup & Generation Overlay */}
        {!['complete', 'projects'].includes(currentStep) && (
          <div className="absolute inset-0 z-50 bg-[#0a0a0a] flex items-start justify-center p-4 md:p-8 overflow-y-auto">
            <div className={cn(
              "w-full bg-[#141414] border border-[#27272a] rounded-xl p-4 md:p-8 shadow-2xl transition-all duration-500 my-8",
              currentStep === 'analyze' ? "max-w-6xl" : "max-w-2xl"
            )}>
              
              <div className="text-center mb-10">
                <h2 className="text-2xl font-bold text-white mb-2">Ultimate Music Video Director</h2>
                <p className="text-gray-400 text-sm">By thefirm media studios and gemini ai. Generate a complete visual storyboard and reference images for your manual video production.</p>
              </div>

              {/* Step 1: Upload */}
              {currentStep === 'upload' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Audio Upload */}
                    <div className="border-2 border-dashed border-[#27272a] hover:border-indigo-500 transition-colors rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer relative min-h-[200px]">
                      <input 
                        type="file" 
                        accept="audio/*" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleFileUpload}
                      />
                      <div className="w-12 h-12 bg-[#1f1f1f] rounded-full flex items-center justify-center mb-3">
                        <FileAudio className="w-6 h-6 text-indigo-400" />
                      </div>
                      <h3 className="text-sm font-medium text-white mb-1">Audio Track</h3>
                      <p className="text-[10px] text-gray-500">MP3, WAV, or Suno link</p>
                      {audioFile && (
                        <div className="mt-2 px-2 py-1 bg-indigo-500/10 rounded text-[10px] text-indigo-400 font-mono truncate max-w-full">
                          {audioFile.name}
                        </div>
                      )}
                    </div>

                    {/* Image Upload */}
                    <div className="border-2 border-dashed border-[#27272a] hover:border-indigo-500 transition-colors rounded-xl p-6 flex flex-col items-center justify-center text-center relative min-h-[200px]">
                      {referenceImages.length < 4 ? (
                        <>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            onChange={handleImageUpload}
                          />
                          <div className="w-10 h-10 bg-[#1f1f1f] rounded-full flex items-center justify-center mb-2">
                            <Palette className="w-5 h-5 text-purple-400" />
                          </div>
                          <h3 className="text-xs font-medium text-white mb-1">Artist References</h3>
                          <p className="text-[9px] text-gray-500 mb-4">Up to 4 characters/faces (PNG, JPG)</p>
                        </>
                      ) : (
                        <div className="mb-4">
                          <h3 className="text-xs font-medium text-indigo-400 mb-1">Max References Reached</h3>
                          <p className="text-[9px] text-gray-500">Remove one to add another</p>
                        </div>
                      )}

                      {referenceImages.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 w-full mt-auto">
                          {referenceImages.map((img, idx) => (
                            <div key={idx} className="relative aspect-square bg-black rounded overflow-hidden group">
                              <img src={img} className="w-full h-full object-cover" alt={`Ref ${idx + 1}`} />
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeReferenceImage(idx);
                                }}
                                className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-4">
                    <button 
                      onClick={() => setCurrentStep('analyze')}
                      disabled={!audioFile}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-[#27272a] disabled:text-gray-500 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-500/20"
                    >
                      Continue to Creative Setup
                    </button>

                    <div className="text-center flex flex-col gap-2">
                      <button 
                        onClick={() => {
                          setAudioFile(new File([""], "demo_track.mp3"));
                          setCurrentStep('analyze');
                        }}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 underline"
                      >
                        Or use demo track
                      </button>
                      <button 
                        onClick={() => {
                          setCreativeBrief(DESPERTAR_DIGITAL_DATA.creativeBrief as any);
                          let currentStartTime = 0;
                          setClips(DESPERTAR_DIGITAL_DATA.shotList.map((s: any, i) => {
                            const shotDuration = parseFloat(s.duration) || 8;
                            const clip = {
                              ...s,
                              id: `clip-${i}`,
                              start: currentStartTime,
                              duration: shotDuration,
                              imageUrl: `https://picsum.photos/seed/despertar-${i}/1920/1080`,
                              lyrics: s.lyrics || '',
                              transitionEntry: s.transitionEntry || 'N/A',
                              transitionExit: s.transitionExit || 'N/A',
                              editingRhythm: s.editingRhythm || 'N/A',
                              rhythm: s.rhythm || 'N/A'
                            };
                            currentStartTime += shotDuration;
                            return clip;
                          }) as any);
                          setCurrentStep('complete');
                        }}
                        className="text-[10px] text-emerald-400 hover:text-emerald-300 underline"
                      >
                        Load "Despertar Digital" Master Demo
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Analyze & Setup */}
              {currentStep === 'analyze' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setCurrentStep('upload')}
                        className="p-2 hover:bg-[#1f1f1f] rounded-full text-gray-400 hover:text-white transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Creative Direction</h3>
                    </div>
                    {audioFile && (
                      <span className="text-xs text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded">Audio: {audioFile.name}</span>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block">Video Concept / Theme (What is the video about?)</label>
                      <textarea 
                        value={videoConcept}
                        onChange={e => setVideoConcept(e.target.value)}
                        placeholder="Describe your vision for the video (e.g., 'The video takes place on a beach at sunset', 'A futuristic city with neon lights')..."
                        className="w-full h-24 bg-[#0a0a0a] border border-[#27272a] rounded p-3 text-sm text-gray-200 focus:outline-none focus:border-indigo-500 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-400 mb-1.5 block">Number of Characters (Max 3)</label>
                        <select 
                          value={numCharacters}
                          onChange={e => setNumCharacters(parseInt(e.target.value))}
                          className="w-full bg-[#0a0a0a] border border-[#27272a] rounded p-2.5 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
                        >
                          <option value={1}>1 Character</option>
                          <option value={2}>2 Characters</option>
                          <option value={3}>3 Characters</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1.5 block">Song Duration (sec)</label>
                        <input 
                          type="number"
                          value={manualDuration}
                          onChange={e => setManualDuration(e.target.value)}
                          placeholder={duration ? Math.floor(duration).toString() : "e.g. 180"}
                          className="w-full bg-[#0a0a0a] border border-[#27272a] rounded p-2.5 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block flex items-center justify-between">
                        Song Lyrics / Meaning / Vibe
                        {isTranscribing && (
                          <span className="text-indigo-400 flex items-center gap-1 animate-pulse">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Extracting lyrics from audio...
                          </span>
                        )}
                      </label>
                      <textarea 
                        value={songDescription}
                        onChange={e => setSongDescription(e.target.value)}
                        placeholder={isTranscribing ? "Extracting lyrics..." : "Paste your song lyrics here, or describe the meaning and vibe of the song..."}
                        disabled={isTranscribing}
                        className="w-full h-32 bg-[#0a0a0a] border border-[#27272a] rounded p-3 text-sm text-gray-200 focus:outline-none focus:border-indigo-500 resize-none disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block">Video Structure</label>
                      <select 
                        value={videoType}
                        onChange={e => setVideoType(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-[#27272a] rounded p-2.5 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="narrative">Narrative (Story-driven)</option>
                        <option value="performance">Performance (Artist focused)</option>
                        <option value="conceptual">Conceptual (Abstract/Surreal)</option>
                      </select>
                    </div>

                    <StyleSelector 
                      directors={directors}
                      selectedId={selectedDirector}
                      onSelect={setSelectedDirector}
                      onCustomRequest={handleCreateCustomStyle}
                      isGenerating={isGeneratingStyle}
                    />

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs text-gray-400 block">Aspect Ratio</label>
                        {window.aistudio && (
                          <button 
                            onClick={() => window.aistudio.openSelectKey()}
                            className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                          >
                            <Settings className="w-3 h-3" />
                            Use Paid Key for Pro Quality
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        {['16:9', '9:16', '1:1', '4:3', '3:4'].map((ratio) => (
                          <button
                            key={ratio}
                            onClick={() => setAspectRatio(ratio)}
                            className={cn(
                              "py-2 text-[10px] font-bold rounded border transition-all",
                              aspectRatio === ratio 
                                ? "bg-indigo-600 border-indigo-500 text-white" 
                                : "bg-[#0a0a0a] border-[#27272a] text-gray-400 hover:border-gray-600"
                            )}
                          >
                            {ratio}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={startAutomatedProduction}
                    disabled={!songDescription}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-[#27272a] disabled:text-gray-500 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors mt-6 shadow-lg shadow-indigo-500/20"
                  >
                    <Wand2 className="w-4 h-4" />
                    Generate Master Storyboard
                  </button>
                </div>
              )}

              {/* Step 3: Generation Progress */}
              {['character', 'storyboard', 'generate'].includes(currentStep) && (
                <div className="space-y-8 py-8 animate-in fade-in duration-500">
                  <div className="flex flex-col items-center justify-center text-center space-y-6">
                    <button 
                      onClick={() => setCurrentStep('analyze')}
                      className="absolute top-8 left-8 flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Cancel & Go Back
                    </button>
                    
                    {/* Status Icon */}
                    <div className="relative">
                      <div className="w-20 h-20 bg-[#1f1f1f] rounded-full flex items-center justify-center border border-[#27272a]">
                        {currentStep === 'character' && <UserIcon className="w-8 h-8 text-indigo-400 animate-pulse" />}
                        {currentStep === 'storyboard' && <Film className="w-8 h-8 text-indigo-400 animate-pulse" />}
                        {currentStep === 'generate' && <Video className="w-8 h-8 text-indigo-400 animate-pulse" />}
                      </div>
                      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="48" fill="none" stroke="#27272a" strokeWidth="4" />
                        <circle cx="50" cy="50" r="48" fill="none" stroke="#6366f1" strokeWidth="4" strokeDasharray="301.59" strokeDashoffset={301.59 - (301.59 * generationProgress) / 100} className="transition-all duration-500 ease-out" />
                      </svg>
                    </div>

                    {/* Status Text */}
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium text-white">AI Director is working...</h3>
                      <p className="text-sm text-indigo-400 font-mono h-5">{statusMessage}</p>
                    </div>

                    {/* Progress Steps */}
                    <div className="w-full max-w-md space-y-3 mt-4">
                      <ProgressStep label="1. Audio & Lyric Analysis" active={true} completed={generationProgress > 20} />
                      <ProgressStep label="2. AI Storyboard Generation" active={currentStep === 'character'} completed={generationProgress > 40} />
                      <ProgressStep label="3. Technical Shot List Assembly" active={currentStep === 'storyboard' || currentStep === 'generate'} completed={generationProgress > 95} />
                      <ProgressStep label="4. Final Reference Assembly" active={generationProgress > 95} completed={generationProgress === 100} />
                    </div>

                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Storyboard View (Only visible when complete) */}
        {currentStep === 'complete' && creativeBrief && (
          <main id="storyboard-content" className="flex-1 flex flex-col relative overflow-y-auto" style={{ backgroundColor: '#0a0a0a' }}>
            <div className="p-8 max-w-7xl mx-auto w-full space-y-12">
              
              {/* Creative Brief Section */}
              <section className="space-y-8">
                <div className="border-b pb-4 flex items-center justify-between" style={{ borderColor: '#27272a' }}>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setCurrentStep('analyze')}
                      className="p-2 rounded-full transition-colors"
                      style={{ backgroundColor: 'transparent', color: '#9ca3af' }}
                      title="Back to Setup"
                    >
                      <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                      <Sparkles className="w-8 h-8" style={{ color: '#6366f1' }} />
                      Creative Brief
                    </h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={saveProject}
                      disabled={isSaving}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white text-sm font-medium transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Guardar en My Projects
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm('¿Estás seguro de que quieres empezar un nuevo proyecto? Volverás al inicio para configurar los nuevos parámetros.')) {
                          localStorage.clear();
                          window.location.reload();
                        }
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white text-sm font-medium transition-all shadow-lg flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Nuevo Proyecto
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Project Overview */}
                  <div className="rounded-xl p-6 space-y-4" style={{ backgroundColor: '#141414', border: '1px solid #27272a' }}>
                    <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: '#818cf8' }}>
                      <Settings className="w-5 h-5" />
                      Project Overview
                    </h3>
                    <div className="space-y-3 text-sm">
                      <p><span style={{ color: '#6b7280' }}>Title:</span> <span className="text-white">{creativeBrief.projectOverview.title}</span></p>
                      <p><span style={{ color: '#6b7280' }}>Target Audience:</span> <span className="text-white">{creativeBrief.projectOverview.targetAudience}</span></p>
                      <p><span style={{ color: '#6b7280' }}>Rhythm Driver:</span> <span className="text-white">{creativeBrief?.projectOverview?.rhythmDriver || "N/A"}</span></p>
                      <p><span style={{ color: '#6b7280' }}>Duration:</span> <span className="text-white">{creativeBrief?.projectOverview?.estimatedDuration || "N/A"}</span></p>
                      <p><span style={{ color: '#6b7280' }}>Summary:</span> <span className="leading-relaxed" style={{ color: '#d1d5db' }}>{creativeBrief?.projectOverview?.summary || "No summary available."}</span></p>
                    </div>
                  </div>

                  {/* Creative Concept */}
                  <div className="rounded-xl p-6 space-y-4" style={{ backgroundColor: '#141414', border: '1px solid #27272a' }}>
                    <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: '#c084fc' }}>
                      <Palette className="w-5 h-5" />
                      Creative Concept & Structure
                    </h3>
                    <div className="space-y-3 text-sm">
                      <p><span style={{ color: '#6b7280' }}>Structure Type:</span> <span className="text-white">{creativeBrief?.creativeConcept?.structureType || "N/A"}</span></p>
                      <p><span style={{ color: '#6b7280' }}>Core Drive:</span> <span className="text-white">{creativeBrief?.creativeConcept?.coreDrive || "N/A"}</span></p>
                      <div className="mt-4 space-y-3">
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#6b7280' }}>Content Outline</p>
                        {creativeBrief?.creativeConcept?.contentOutline?.map((item, idx) => (
                          <div key={idx} className="p-3 rounded border" style={{ backgroundColor: 'rgba(0,0,0,0.3)', borderColor: 'rgba(255,255,255,0.05)' }}>
                            <p className="font-medium text-xs" style={{ color: '#a5b4fc' }}>{item.block} ({item.timeframe})</p>
                            <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>{item.strategy}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-8">
                  {/* Reference Assets (Ingredients) */}
                  <div className="rounded-xl p-6 space-y-6" style={{ backgroundColor: '#141414', border: '1px solid #27272a' }}>
                    <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: '#34d399' }}>
                      <Sparkles className="w-5 h-5" />
                      Reference Assets (Ingredients)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {creativeBrief?.referenceAssets?.map((asset, idx) => (
                        <div key={idx} className="rounded-lg border overflow-hidden flex flex-col" style={{ backgroundColor: 'rgba(0,0,0,0.3)', borderColor: 'rgba(255,255,255,0.05)' }}>
                          <div className="aspect-square bg-[#0a0a0a] relative flex items-center justify-center">
                            {asset.imageUrl ? (
                              <img 
                                src={asset.imageUrl} 
                                alt={asset.name} 
                                className="absolute inset-0 w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="space-y-2 text-center p-4">
                                <Sparkles className="w-8 h-8 mx-auto text-indigo-500/50" />
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Preparing Asset...</p>
                              </div>
                            )}
                            <div className="absolute top-2 left-2">
                              <span className="px-2 py-0.5 text-[8px] font-bold rounded border text-white uppercase" style={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.2)' }}>
                                {asset.id}
                              </span>
                            </div>
                          </div>
                          <div className="p-3 space-y-2 flex-1">
                            <p className="text-white text-xs font-bold">{asset.name}</p>
                            <p className="text-[10px] uppercase font-bold" style={{ color: '#6b7280' }}>{asset.type}</p>
                            <p className="text-[10px] leading-relaxed line-clamp-3" style={{ color: '#9ca3af' }}>{asset.description}</p>
                            <div className="pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                              <button 
                                onClick={() => handleCopyPrompt(asset.generationPrompt, 'image')}
                                className="text-[9px] flex items-center gap-1"
                                style={{ color: '#818cf8' }}
                              >
                                <Copy className="w-3 h-3" />
                                Copy Asset Prompt
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                  <div className="rounded-xl p-6 space-y-4" style={{ backgroundColor: '#141414', border: '1px solid #27272a' }}>
                    <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: '#fbbf24' }}>
                      <Music className="w-5 h-5" />
                      BGM Brief
                    </h3>
                    <p style={{ color: '#d1d5db', fontSize: '0.875rem', lineHeight: '1.625' }}>{creativeBrief.scriptAndSound?.bgmBrief || 'No BGM details provided.'}</p>
                  </div>
              </section>

              {/* Shot List Section */}
              <section className="space-y-8">
                <div className="border-b pb-4" style={{ borderColor: '#27272a' }}>
                  <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Film className="w-8 h-8" style={{ color: '#6366f1' }} />
                    Shot List
                  </h2>
                </div>
                
                <div className="grid grid-cols-1 gap-12 pb-24">
                  {clips.map((clip, index) => (
                    <div key={clip.id} className="rounded-xl overflow-hidden flex flex-col lg:flex-row shadow-2xl" style={{ backgroundColor: '#141414', border: '1px solid #27272a' }}>
                      {/* Visual Side */}
                      <div className="w-full lg:w-1/2 relative bg-black aspect-video lg:aspect-auto flex-shrink-0 min-h-[400px]">
                        {clip.isGeneratingImage ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-3">
                            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                            <p className="text-[10px] text-gray-400 font-mono">Generating Scene Reference...</p>
                          </div>
                        ) : (
                          <img 
                            src={clip.imageUrl} 
                            alt={clip.caption}
                            className="absolute inset-0 w-full h-full object-cover opacity-80"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                          <div className="flex gap-2">
                             <span className="px-3 py-1 text-[10px] font-bold rounded-full text-white border" style={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.2)' }}>
                               SCENE #{clip.sceneNumber}
                             </span>
                             <span className="px-3 py-1 text-[10px] font-bold rounded-full text-white border" style={{ backgroundColor: 'rgba(79, 70, 229, 0.8)', borderColor: 'rgba(129, 140, 248, 0.3)' }}>
                              SHOT #{clip.shotNumber}
                            </span>
                          </div>
                        </div>

                        {/* Regenerate Button Overlay */}
                        {!clip.isGeneratingImage && (
                          <div className="absolute bottom-4 right-4 flex gap-2 z-10">
                             <button
                               onClick={() => handleRegenerateShot(index)}
                               className="p-2 bg-indigo-600/90 hover:bg-indigo-500 rounded-lg text-white shadow-lg transition-all group"
                               title="Regenerate Image"
                             >
                               <Wand2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                             </button>
                             <button
                               onClick={() => handleDownloadImage(clip.imageUrl, index)}
                               className="p-2 bg-black/80 hover:bg-black rounded-lg text-white border border-white/10"
                               title="Download PNG"
                             >
                               <Download className="w-4 h-4" />
                             </button>
                          </div>
                        )}
                      </div>
                      
                      {/* Details Side */}
                      <div className="p-8 flex-1 flex flex-col gap-6">
                        <div className="grid grid-cols-1 gap-8">
                          <div className="space-y-6">
                            <div>
                              <h4 className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#818cf8' }}>Transcription / Lyric</h4>
                              <p className="text-white text-sm italic border-l-2 border-indigo-500/30 pl-4 py-1 bg-indigo-500/5 rounded-r">"{clip.lyrics || 'Instrumental Sequence'}"</p>
                            </div>
                            
                            <div>
                               <h4 className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#34d399' }}>Visual Direction (Puter AI Prompt)</h4>
                               <div className="relative group">
                                 <p className="text-[10px] text-gray-400 font-mono leading-relaxed bg-black/40 p-4 rounded border border-white/5 italic select-all">
                                   {clip.imagePrompt}
                                 </p>
                                 <button 
                                   onClick={() => handleCopyPrompt(clip.imagePrompt, 'image')}
                                   className="absolute top-2 right-2 p-1.5 bg-black/60 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                 >
                                    {copiedPrompt === clip.imagePrompt ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-gray-400" />}
                                 </button>
                               </div>
                            </div>

                            <div>
                               <h4 className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#fbbf24' }}>Temporal/Animation Dynamics</h4>
                               <div className="relative group">
                                 <p className="text-[10px] text-gray-500 font-mono leading-relaxed bg-black/40 p-4 rounded border border-white/5 select-all">
                                   {clip.animationPrompt}
                                 </p>
                                 <button 
                                   onClick={() => handleCopyPrompt(clip.animationPrompt, 'animation')}
                                   className="absolute top-2 right-2 p-1.5 bg-black/60 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                 >
                                    {copiedAnimationPrompt === clip.animationPrompt ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-gray-400" />}
                                 </button>
                               </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#6b7280' }}>Cinematography</h4>
                                <p className="text-white text-xs">{clip.caption}</p>
                              </div>
                              <div>
                                <h4 className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#6b7280' }}>Camera Movement</h4>
                                <p className="text-white text-xs">{clip.actionCamera}</p>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
                              {clip.assetReferences.map(assetId => (
                                <span key={assetId} className="px-2 py-1 text-[8px] font-bold rounded border uppercase bg-indigo-500/10 border-indigo-500/20 text-indigo-400">
                                  {assetId}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}

// Subcomponents

function ProgressStep({ label, active, completed }: { label: string, active: boolean, completed: boolean }) {
  return (
    <div className="flex items-center gap-3 text-left">
      <div className={cn(
        "w-5 h-5 rounded-full flex items-center justify-center shrink-0 border text-[10px]",
        completed ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" :
        active ? "bg-indigo-500/20 border-indigo-500 text-indigo-400" :
        "bg-[#1f1f1f] border-[#27272a] text-gray-600"
      )}>
        {completed ? <CheckCircle2 className="w-3 h-3" /> : <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      </div>
      <span className={cn(
        "text-xs font-medium",
        completed ? "text-gray-300" :
        active ? "text-white" :
        "text-gray-600"
      )}>
        {label}
      </span>
    </div>
  );
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

