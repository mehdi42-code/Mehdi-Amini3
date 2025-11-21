import React, { useState, useRef } from 'react';
import { Upload, Camera, Glasses, RefreshCw, User, ImagePlus, Sparkles } from 'lucide-react';
import { AppMode, ChatMessage } from './types';
import { generateEyewearImage, chatWithConsultant } from './services/geminiService';
import BeforeAfterSlider from './components/BeforeAfterSlider';
import ChatInterface from './components/ChatInterface';

// Placeholder image until user uploads
const PLACEHOLDER_FACE = "https://picsum.photos/600/800?grayscale"; 

export default function App() {
  const [mode, setMode] = useState<AppMode>(AppMode.CONSULTANT);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [glassesImage, setGlassesImage] = useState<string | null>(null); // For Try-On mode
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  const userFileInputRef = useRef<HTMLInputElement>(null);
  const glassesFileInputRef = useRef<HTMLInputElement>(null);

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'user' | 'glasses') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      if (type === 'user') {
        setUserImage(result);
        setGeneratedImage(null); // Reset previous generation
      } else {
        setGlassesImage(result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Initial Generation (Consultant or Try-On)
  const handleGenerate = async () => {
    if (!userImage) return;
    if (mode === AppMode.TRY_ON && !glassesImage) {
      alert("لطفا تصویر عینک را نیز آپلود کنید");
      return;
    }

    setIsLoading(true);
    try {
      const prompt = mode === AppMode.CONSULTANT 
        ? "Stylish, modern eyeglasses that suit this face shape. Professional and chic." 
        : "Specific glasses overlay";
      
      const resultImg = await generateEyewearImage(userImage, prompt, mode === AppMode.TRY_ON ? glassesImage! : undefined);
      setGeneratedImage(resultImg);
      
      // Add initial welcome message to chat if empty
      if (messages.length === 0) {
        setMessages([{
          id: 'init',
          role: 'model',
          text: mode === AppMode.CONSULTANT 
            ? "من بر اساس چهره شما این سبک را پیشنهاد دادم. چطور است؟ می‌توانیم رنگ یا مدل را تغییر دهیم."
            : "عینک انتخابی شما روی صورت قرار گرفت. آیا نیاز به تنظیمات بیشتری دارید؟"
        }]);
      }
    } catch (error) {
      console.error(error);
      alert("خطا در پردازش تصویر. لطفا دوباره تلاش کنید.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Chat Text Message (Get info/links)
  const handleSendMessage = async (text: string) => {
    const newUserMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text };
    setMessages(prev => [...prev, newUserMsg]);
    setIsLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, text: m.text }));
      const { text: replyText, links } = await chatWithConsultant(text, history);
      
      const newModelMsg: ChatMessage = { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        text: replyText,
        links 
      };
      setMessages(prev => [...prev, newModelMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Chat Visualize Request (Edit Image)
  const handleVisualize = async (prompt: string) => {
    if (!userImage) return;
    
    const newUserMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: `تغییر طرح: ${prompt}` };
    setMessages(prev => [...prev, newUserMsg]);
    setIsLoading(true);

    try {
      // We pass the original image again to avoid degradation, but the prompt now includes specific instructions
      // Ideally, to edit the *generated* image, we'd pass generatedImage. 
      // However, passing original + explicit prompt often yields cleaner results for "Change color to red".
      // Let's try editing the Generated Image if available, otherwise Original.
      
      // Actually, for "Change frame color", using the original and describing the new state is usually better 
      // than img-to-img on an already generated image in standard GenAI flows unless using specific mask editing.
      // We will use Original + New Prompt.
      
      const newImage = await generateEyewearImage(userImage, prompt);
      setGeneratedImage(newImage);

      const newModelMsg: ChatMessage = { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        text: "تغییرات اعمال شد. تصویر جدید را مشاهده کنید. آیا این سبک را می‌پسندید؟" 
      };
      setMessages(prev => [...prev, newModelMsg]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "متاسفم، نتوانستم تصویر را ویرایش کنم." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Glasses className="text-primary w-8 h-8" />
            <span className="font-bold text-xl text-slate-800">VisionAI Stylist</span>
          </div>
          <div className="flex gap-4 text-sm font-medium">
            <button 
              onClick={() => setMode(AppMode.CONSULTANT)}
              className={`px-4 py-2 rounded-full transition-colors ${mode === AppMode.CONSULTANT ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              مشاور هوشمند
            </button>
            <button 
              onClick={() => setMode(AppMode.TRY_ON)}
              className={`px-4 py-2 rounded-full transition-colors ${mode === AppMode.TRY_ON ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              تست مجازی
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Visualization (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Image Upload Area */}
            {!userImage ? (
               <div 
                 onClick={() => userFileInputRef.current?.click()}
                 className="border-2 border-dashed border-slate-300 rounded-2xl h-96 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group"
               >
                 <div className="p-6 bg-white rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform">
                   <Camera className="w-10 h-10 text-primary" />
                 </div>
                 <h3 className="text-lg font-bold text-slate-700">آپلود تصویر چهره</h3>
                 <p className="text-slate-400 text-sm mt-2">برای شروع کلیک کنید</p>
                 <input 
                   type="file" 
                   accept="image/*" 
                   ref={userFileInputRef} 
                   className="hidden" 
                   onChange={(e) => handleFileUpload(e, 'user')}
                 />
               </div>
            ) : (
              <div className="space-y-4">
                {/* The Main Display */}
                {generatedImage ? (
                  <BeforeAfterSlider beforeImage={userImage} afterImage={generatedImage} />
                ) : (
                  <div className="relative h-96 md:h-[500px] rounded-2xl overflow-hidden border border-slate-200 bg-white flex items-center justify-center">
                     <img src={userImage} alt="User" className="absolute inset-0 w-full h-full object-cover opacity-50 blur-sm" />
                     <div className="relative z-10 text-center p-6 bg-white/90 backdrop-blur-md rounded-xl shadow-lg max-w-xs">
                        <User className="w-12 h-12 mx-auto text-primary mb-3" />
                        <h3 className="font-bold text-lg">تصویر آماده است</h3>
                        
                        {/* If Try-On Mode, need second image */}
                        {mode === AppMode.TRY_ON && !glassesImage && (
                             <div 
                                onClick={() => glassesFileInputRef.current?.click()}
                                className="mt-4 border border-dashed border-slate-400 p-4 rounded-lg cursor-pointer hover:bg-slate-50"
                             >
                                <p className="text-sm font-medium text-slate-700 flex items-center justify-center gap-2">
                                    <ImagePlus size={16} />
                                    افزودن تصویر عینک
                                </p>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    ref={glassesFileInputRef} 
                                    className="hidden" 
                                    onChange={(e) => handleFileUpload(e, 'glasses')}
                                />
                             </div>
                        )}
                        
                        {/* Generate Button */}
                        {(mode === AppMode.CONSULTANT || (mode === AppMode.TRY_ON && glassesImage)) && (
                            <button 
                                onClick={handleGenerate}
                                disabled={isLoading}
                                className="mt-4 w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-secondary transition-colors flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <RefreshCw className="animate-spin" />
                                ) : (
                                    <Sparkles />
                                )}
                                {mode === AppMode.CONSULTANT ? 'پیشنهاد مدل هوشمند' : 'تست عینک روی صورت'}
                            </button>
                        )}
                     </div>
                  </div>
                )}

                {/* Mini Previews / Resets */}
                <div className="flex gap-4 overflow-x-auto py-2">
                    <button 
                        onClick={() => { setUserImage(null); setGeneratedImage(null); setGlassesImage(null); setMessages([]); }}
                        className="flex items-center gap-2 text-sm text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
                    >
                        <RefreshCw size={14} />
                        شروع مجدد
                    </button>
                    
                    {/* Show uploaded glasses thumbnail in Try-On mode */}
                    {mode === AppMode.TRY_ON && glassesImage && (
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200">
                            <img src={glassesImage} alt="Glasses" className="w-full h-full object-cover" />
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-[8px] text-white text-center">عینک</div>
                        </div>
                    )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Chat & Controls (5 cols) */}
          <div className="lg:col-span-5">
             <div className="sticky top-24">
                <div className="mb-4">
                    <h2 className="text-2xl font-bold text-slate-800 mb-1">دستیار شخصی</h2>
                    <p className="text-slate-500 text-sm">
                        {mode === AppMode.CONSULTANT 
                            ? 'طرح را با چت تغییر دهید و لینک خرید پیدا کنید.'
                            : 'مشکلات فریم را اصلاح کنید و مدل‌های مشابه پیدا کنید.'}
                    </p>
                </div>
                
                <ChatInterface 
                    messages={messages}
                    loading={isLoading}
                    onSendMessage={handleSendMessage}
                    onVisualize={handleVisualize}
                />

                <div className="mt-6 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                    <h4 className="font-bold text-indigo-900 text-sm mb-2">💡 راهنما:</h4>
                    <ul className="text-xs text-indigo-700 space-y-1 list-disc list-inside">
                        <li>برای تغییر رنگ فریم از دکمه <strong>تولید طرح (بنفش)</strong> استفاده کنید.</li>
                        <li>برای پیدا کردن قیمت و فروشگاه از دکمه <strong>ارسال (آبی)</strong> استفاده کنید.</li>
                        <li>می‌توانید بنویسید: "این مدل را با فریم طلایی نشان بده".</li>
                    </ul>
                </div>
             </div>
          </div>

        </div>
      </main>
    </div>
  );
}