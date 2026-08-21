import React, { useState } from 'react';
import { Cpu, Globe, Code2, ArrowRight, ExternalLink, Github, Sparkles, Filter } from 'lucide-react';
import { PROJECTS } from '../data/portfolioData';
import { Project } from '../types';
import { Link } from 'react-router-dom';

export default function Projects() {
  const [filter, setFilter] = useState<'all' | 'iot' | 'web' | 'fintech'>('all');

  const filteredProjects = filter === 'all' 
    ? PROJECTS 
    : PROJECTS.filter(p => p.category === filter);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Cpu': return <Cpu className="w-6 h-6 text-[#39AEA9]" />;
      case 'Globe': return <Globe className="w-6 h-6 text-[#557B83]" />;
      case 'Code2': return <Code2 className="w-6 h-6 text-[#12181A]" />;
      default: return <Sparkles className="w-6 h-6 text-[#39AEA9]" />;
    }
  };

  return (
    <div className="min-h-screen text-[#12181A] bg-white pt-28 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Ambient Glows */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-[#39AEA9]/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#A2D5AB]/15 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel text-[#1D5C58] text-xs font-bold uppercase tracking-widest mb-4 font-mono shadow-sm">
            <Cpu className="w-3.5 h-3.5 text-[#39AEA9]" />
            Engineering Case Studies & Deliverables
          </div>
          <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-[#12181A] tracking-tight mb-4">
            Featured Projects & IoT Architecture
          </h1>
          <p className="text-[#557B83] text-base sm:text-lg leading-relaxed">
            Bridging high-frequency embedded microcontroller firmware with modern cloud web interfaces and secure payment workflows.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-12">
          {[
            { id: 'all', label: 'All Projects' },
            { id: 'iot', label: 'IoT & Microcontrollers' },
            { id: 'web', label: 'Web Applications' },
            { id: 'fintech', label: 'Fintech & Dashboards' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                filter === tab.id
                  ? 'bg-[#12181A] text-white shadow-md font-extrabold'
                  : 'glass-panel text-[#557B83] hover:text-[#12181A] hover:border-[#39AEA9]/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="glass-panel-interactive rounded-3xl p-6 sm:p-8 flex flex-col justify-between group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#39AEA9]/5 rounded-full blur-2xl -z-10" />

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-[#F4F8F7] border border-[#557B83]/15 shadow-sm">
                    {getIcon(project.iconName)}
                  </div>
                  {project.stats && (
                    <span className="text-xs font-mono px-3 py-1 rounded-full bg-[#39AEA9]/15 text-[#1D5C58] border border-[#39AEA9]/30 font-semibold">
                      {project.stats}
                    </span>
                  )}
                </div>

                <h3 className="text-xl sm:text-2xl font-display font-bold text-[#12181A] mb-3 group-hover:text-[#39AEA9] transition-colors">
                  {project.title}
                </h3>

                <p className="text-sm text-[#557B83] mb-6 leading-relaxed">
                  {project.description}
                </p>

                {/* Tech Tags */}
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {project.tags.map((tag, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-mono bg-[#F4F8F7] border border-[#557B83]/15 text-[#1D5C58]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-[#557B83]/15 flex items-center justify-between">
                <Link
                  to="/services"
                  className="text-xs font-bold uppercase tracking-wider text-[#39AEA9] hover:text-[#12181A] flex items-center gap-1.5"
                >
                  Commission Similar Project <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  to="/store"
                  className="text-xs font-semibold text-[#557B83] hover:text-[#12181A]"
                >
                  View Code Templates
                </Link>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
