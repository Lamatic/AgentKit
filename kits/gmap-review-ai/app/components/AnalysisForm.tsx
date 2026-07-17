// // app/components/AnalysisForm.tsx
// 'use client'; // <--- MUST HAVE THIS

// import React, { useState } from 'react';
// import { Zap, Plus, Trash2 } from 'lucide-react';

// // Use "export default" exactly like this
// export default function AnalysisForm({ onSubmit, isLoading }: any) {
//   const [formData, setFormData] = useState({
//     business_name: '',
//     business_maps_url: '',
//     competitor_maps_urls: [''],
//   });

//   const handleCompetitorChange = (index: number, value: string) => {
//     const newCompetitors = [...formData.competitor_maps_urls];
//     newCompetitors[index] = value;
//     setFormData({ ...formData, competitor_maps_urls: newCompetitors });
//   };

//   return (
//     <div className="bg-white/[0.03] border border-white/10 p-10 rounded-[2rem] backdrop-blur-2xl">
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
//         <div className="space-y-6">
//           <div className="group">
//             <label className="text-[10px] uppercase tracking-[0.3em] text-teal-400 font-bold mb-2 block">Primary Business</label>
//             <input 
//               value={formData.business_name}
//               onChange={(e) => setFormData({...formData, business_name: e.target.value})}
//               placeholder="Business Name" 
//               className="w-full bg-transparent border-b border-white/10 py-4 focus:border-teal-400 outline-none transition-all placeholder:text-white/10 text-xl font-light"
//             />
//           </div>
//           <input 
//             value={formData.business_maps_url}
//             onChange={(e) => setFormData({...formData, business_maps_url: e.target.value})}
//             placeholder="Google Maps URL" 
//             className="w-full bg-transparent border-b border-white/10 py-4 focus:border-teal-400 outline-none transition-all placeholder:text-white/10 text-sm"
//           />
//         </div>
        
//         <div className="space-y-4">
//           <label className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-bold mb-2 block">Competitors</label>
//           {formData.competitor_maps_urls.map((url, i) => (
//             <input 
//               key={i}
//               value={url}
//               onChange={(e) => handleCompetitorChange(i, e.target.value)}
//               placeholder="Competitor URL..." 
//               className="w-full bg-transparent border-b border-white/10 py-2 focus:border-teal-400 outline-none transition-all placeholder:text-white/10 text-sm"
//             />
//           ))}
//         </div>
//       </div>

//       <button 
//         type="button"
//         onClick={() => onSubmit(formData)}
//         disabled={isLoading}
//         className="w-full py-6 rounded-full bg-white text-black font-black uppercase tracking-[0.2em] text-xs hover:bg-teal-400 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
//       >
//         {isLoading ? "Analyzing Data Streams..." : "Initialize GMap Intelligence"}
//       </button>
//     </div>
//   );
// }



// -----------------------------------

// app/components/AnalysisForm.tsx
'use client';

import { Zap, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function AnalysisForm({ onSubmit, isLoading }: any) {
  const [formData, setFormData] = useState({
    business_name: '',
    business_maps_url: '',
    competitor_maps_urls: [], // Start with empty array instead of ['']
  });

  const addCompetitor = () => {
    setFormData({
      ...formData, 
      competitor_maps_urls: [...formData.competitor_maps_urls, '' as never]
    });
  };

  const handleCompetitorChange = (index: number, value: string) => {
    const newCompetitors = [...formData.competitor_maps_urls];
    newCompetitors[index] = value as never;
    setFormData({ ...formData, competitor_maps_urls: newCompetitors });
  };

  const handleSubmit = () => {
    // Basic validation
    if (!formData.business_maps_url.startsWith('http')) {
      alert("Please enter a valid Google Maps URL for the primary business.");
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="bg-white/[0.03] border border-white/10 p-10 rounded-[2rem] backdrop-blur-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
        {/* Primary Business Section */}
        <div className="space-y-6">
          <div>
            <label className="text-[10px] uppercase tracking-[0.3em] text-teal-400 font-bold mb-2 block">Primary Business</label>
            <input 
              onChange={(e) => setFormData({...formData, business_name: e.target.value})}
              placeholder="e.g. Hard Rock Hotel" 
              className="w-full bg-transparent border-b border-white/10 py-4 focus:border-teal-400 outline-none transition-all placeholder:text-white/10 text-xl font-light text-white"
            />
          </div>
          <input 
            onChange={(e) => setFormData({...formData, business_maps_url: e.target.value})}
            placeholder="Paste Google Maps URL here..." 
            className="w-full bg-transparent border-b border-white/10 py-4 focus:border-teal-400 outline-none transition-all placeholder:text-white/10 text-sm text-white/60"
          />
        </div>
        
        {/* Competitor Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-2">
             <label className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-bold block">Competitors</label>
             <button onClick={addCompetitor} className="text-teal-400 hover:text-white transition-colors">
               <Plus size={16} />
             </button>
          </div>
          {formData.competitor_maps_urls.map((url, i) => (
            <div key={i} className="flex gap-2 items-center">
                <input 
                  value={url}
                  onChange={(e) => handleCompetitorChange(i, e.target.value)}
                  placeholder="Competitor Maps URL..." 
                  className="flex-1 bg-transparent border-b border-white/10 py-2 focus:border-teal-400 outline-none transition-all placeholder:text-white/10 text-sm text-white/50"
                />
                <button 
                   onClick={() => setFormData({...formData, competitor_maps_urls: formData.competitor_maps_urls.filter((_, idx) => idx !== i)})}
                   className="text-white/10 hover:text-red-500 transition-colors"
                >
                    <Trash2 size={14} />
                </button>
            </div>
          ))}
          {formData.competitor_maps_urls.length === 0 && (
            <p className="text-[10px] text-white/10 italic">No competitors added. Analysis will focus solely on your business.</p>
          )}
        </div>
      </div>

      <button 
        onClick={handleSubmit}
        disabled={isLoading || !formData.business_maps_url}
        className="w-full py-6 rounded-full bg-white text-black font-black uppercase tracking-[0.2em] text-xs hover:bg-teal-400 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-20"
      >
        {isLoading ? "Analyzing Data Streams..." : "Initialize GMap Intelligence"}
      </button>
    </div>
  );
}