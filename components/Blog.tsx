
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BLOG_POSTS } from '../constants';
import { BlogPost } from '../types';

const Blog: React.FC = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();

  // Find the post if a slug is present in the URL
  const selectedPost = slug ? BLOG_POSTS.find(p => p.slug === slug) : null;

  const handlePostClick = (post: BlogPost) => {
    navigate(`/insights/${post.slug}`);
    window.scrollTo(0, 0);
  };

  const handleBackToList = () => {
    navigate('/insights');
    window.scrollTo(0, 0);
  };

  if (selectedPost) {
    return (
      <div className="fade-in bg-white min-h-screen">
        <section className="pt-32 pb-16 bg-brand-navy text-white">
          <div className="max-w-4xl mx-auto px-6">
            <button 
              onClick={handleBackToList}
              className="text-brand-gold text-[10px] uppercase tracking-widest font-bold mb-8 flex items-center hover:opacity-80 transition-all"
            >
              ← Back to Insights
            </button>
            <div className="flex items-center space-x-4 mb-6">
              <span className="text-brand-gold text-[10px] uppercase tracking-widest font-bold">{selectedPost.category}</span>
              <span className="w-1 h-1 bg-white/20 rounded-full"></span>
              <span className="text-white/40 text-[10px] uppercase tracking-widest">{selectedPost.date}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-serif leading-[1.1] mb-8 font-medium">
              {selectedPost.title}
            </h1>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-brand-gold flex items-center justify-center font-serif text-brand-navy font-bold text-lg">T</div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-white">Tegemea Editorial</p>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">Operational Strategy Group</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-6">
            {selectedPost.image && (
              <div className="mb-24">
                <img 
                  src={selectedPost.image} 
                  alt={selectedPost.title} 
                  className="w-full aspect-[21/9] object-cover shadow-2xl rounded-sm grayscale hover:grayscale-0 transition-all duration-1000"
                />
              </div>
            )}
            
            <div className="max-w-3xl mx-auto">
              <article className="prose prose-xl prose-slate max-w-none 
                prose-headings:font-serif prose-headings:text-brand-navy
                prose-p:text-brand-charcoal/90 prose-p:font-light prose-p:leading-[1.8] prose-p:mb-6 prose-p:text-lg
                prose-h2:text-2xl md:prose-h2:text-3xl prose-h2:font-extrabold prose-h2:mt-12 prose-h2:mb-6 prose-h2:tracking-tight prose-h2:text-brand-navy prose-h2:leading-tight
                prose-h3:text-xl prose-h3:font-bold prose-h3:mt-10 prose-h3:mb-4
                prose-strong:text-brand-navy prose-strong:font-bold
                prose-blockquote:border-l-brand-gold prose-blockquote:bg-brand-sand/30 prose-blockquote:py-6 prose-blockquote:px-10 prose-blockquote:italic prose-blockquote:text-brand-navy prose-blockquote:font-serif
                ">
                <div 
                  dangerouslySetInnerHTML={{ __html: selectedPost.content || `
                    <p>This insight is currently part of our private operational briefing series.</p>
                    <p>At Tegemea, we believe that strategic infrastructure is the foundation of scale. Our full editorial content is released to our partners first.</p>
                    <p>To discuss the themes of this article in the context of your firm, please reach out for a consultation.</p>
                  ` }} 
                  className="article-content selection:bg-brand-gold/20"
                />
              </article>

              <div className="mt-28 p-12 bg-brand-navy text-white text-center rounded-sm shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 -mr-32 -mt-32 rounded-full blur-3xl"></div>
                <h3 className="text-3xl font-serif mb-6 relative z-10">Scale with Confidence.</h3>
                <p className="text-white/60 mb-10 font-light max-w-lg mx-auto relative z-10 leading-relaxed">
                  Join the leaders who have already transitioned from task-delegation to strategic operational ownership with Tegemea.
                </p>
                <button 
                  onClick={() => navigate('/contact')}
                  className="relative z-10 px-12 py-5 bg-brand-gold text-brand-navy text-[11px] uppercase tracking-[0.2em] font-bold hover:bg-white transition-all shadow-xl"
                >
                  Book a Strategic Consultation
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="fade-in bg-white min-h-screen">
      <section className="pt-24 pb-20 bg-brand-navy text-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="max-w-4xl">
            <span className="text-brand-gold font-bold tracking-[0.4em] text-[11px] uppercase mb-8 block">Operational Intelligence</span>
            <h1 className="text-5xl md:text-7xl font-serif mb-6 leading-tight">Executive <span className="italic">Infrastructure.</span></h1>
            <p className="text-brand-gold text-lg md:text-xl font-medium tracking-wide mb-8">
              The operational edge for professional services leaders.
            </p>
            <p className="text-white/60 text-lg font-light leading-relaxed max-w-3xl">
              Strategic intelligence on delegation, organisational design, and the systems that separate exceptional firms from the rest.
            </p>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16">
            {BLOG_POSTS.map((post) => (
              <article 
                key={post.id} 
                className="group cursor-pointer flex flex-col h-full"
                onClick={() => handlePostClick(post)}
              >
                <div className="overflow-hidden mb-8 aspect-[16/10] bg-brand-sand relative">
                  <img 
                    src={post.image} 
                    alt={post.title} 
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000"
                  />
                  <div className="absolute inset-0 bg-brand-navy/10 group-hover:bg-transparent transition-all duration-500"></div>
                </div>
                <div className="flex flex-col flex-1">
                  <div className="flex items-center space-x-4 mb-5">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-brand-gold font-bold">{post.category}</span>
                    <span className="w-1 h-1 bg-brand-navy/10 rounded-full"></span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-brand-stone font-medium">{post.date}</span>
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-serif text-brand-navy mb-5 group-hover:text-brand-gold transition-colors duration-500 leading-snug">
                    {post.title}
                  </h3>
                  <p className="text-brand-charcoal/60 text-sm leading-relaxed mb-8 font-light line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="mt-auto flex items-center justify-between border-t border-brand-navy/5 pt-8">
                    <span className="text-[11px] uppercase tracking-[0.3em] font-bold text-brand-navy group-hover:text-brand-gold transition-all flex items-center">
                      Read Article <span className="ml-2 group-hover:translate-x-2 transition-transform">→</span>
                    </span>
                    <span className="text-[9px] uppercase tracking-widest text-brand-stone font-semibold">{post.readTime}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Blog;
