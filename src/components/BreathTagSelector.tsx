import { useState, useEffect } from 'react';
import { Plus, X, Check, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface BreathTag {
  id: string;
  name: string;
  color: string;
}

interface BreathTagSelectorProps {
  selectedTags: BreathTag[];
  onTagsChange: (tags: BreathTag[]) => void;
  className?: string;
  compact?: boolean;
}

// Warm, calming colors for breath/rest tags
const breathColors = [
  'hsl(25, 80%, 55%)',   // Warm orange
  'hsl(45, 85%, 55%)',   // Gold
  'hsl(340, 65%, 60%)',  // Soft pink
  'hsl(280, 55%, 55%)',  // Lavender
  'hsl(180, 50%, 50%)',  // Teal
  'hsl(120, 40%, 50%)',  // Sage green
];

export function BreathTagSelector({ selectedTags, onTagsChange, className, compact = false }: BreathTagSelectorProps) {
  const [tags, setTags] = useState<BreathTag[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadTags();
    }
  }, [user]);

  const loadTags = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', user.id)
        .eq('tag_type', 'breath')
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      setTags(data?.map(t => ({
        id: t.id,
        name: t.name,
        color: t.color || breathColors[0]
      })) || []);
    } catch (e) {
      console.error('Error loading breath tags:', e);
    } finally {
      setLoading(false);
    }
  };

  const createTag = async () => {
    if (!newTagName.trim() || !user) return;
    
    const colorIndex = tags.length % breathColors.length;
    const newTag = {
      user_id: user.id,
      name: newTagName.trim(),
      color: breathColors[colorIndex],
      tag_type: 'breath'
    };

    try {
      const { data, error } = await supabase
        .from('tags')
        .insert(newTag)
        .select()
        .single();

      if (error) throw error;
      
      const tag: BreathTag = {
        id: data.id,
        name: data.name,
        color: data.color || breathColors[0]
      };
      
      setTags([...tags, tag]);
      onTagsChange([...selectedTags, tag]);
      setNewTagName('');
      setIsCreating(false);
    } catch (e) {
      console.error('Error creating breath tag:', e);
    }
  };

  const toggleTag = (tag: BreathTag) => {
    const isSelected = selectedTags.some(t => t.id === tag.id);
    if (isSelected) {
      onTagsChange(selectedTags.filter(t => t.id !== tag.id));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const deleteTag = async (tagId: string) => {
    try {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', tagId);

      if (error) throw error;
      
      setTags(tags.filter(t => t.id !== tagId));
      onTagsChange(selectedTags.filter(t => t.id !== tagId));
    } catch (e) {
      console.error('Error deleting breath tag:', e);
    }
  };

  if (loading) {
    return (
      <div className={cn("animate-pulse h-12 bg-white/5 rounded-xl", className)} />
    );
  }

  return (
    <div className={cn(compact ? "space-y-2" : "space-y-3", className)}>
      {/* Header */}
      {!compact && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Brain className="w-4 h-4" />
          <span>Como você está se sentindo?</span>
        </div>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const isSelected = selectedTags.some(t => t.id === tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag)}
              className={cn(
                "group relative flex items-center gap-1.5 rounded-full font-medium transition-all duration-200",
                "border backdrop-blur-sm",
                compact ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm",
                isSelected
                  ? "border-white/30 shadow-lg scale-105"
                  : "border-white/10 hover:border-white/20 opacity-70 hover:opacity-100"
              )}
              style={{
                backgroundColor: isSelected ? `${tag.color}30` : 'hsla(30, 40%, 20%, 0.4)',
                color: isSelected ? 'white' : 'hsl(30, 20%, 80%)'
              }}
            >
              <span 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              {tag.name}
              {isSelected && (
                <Check className="w-3.5 h-3.5 ml-0.5" />
              )}
              
              {/* Delete button on hover */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteTag(tag.id);
                }}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </button>
          );
        })}
        
        {/* Create new tag button */}
        {!isCreating && (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border border-dashed border-orange-400/30 text-muted-foreground hover:border-orange-400/50 hover:text-orange-300"
          >
            <Plus className="w-4 h-4" />
            Nova tag
          </button>
        )}
      </div>

      {/* Create tag input */}
      {isCreating && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                createTag();
              } else if (e.key === 'Escape') {
                setIsCreating(false);
                setNewTagName('');
              }
            }}
            placeholder="Ex: relaxado, energizado, ansioso..."
            autoFocus
            className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-orange-400/50 text-sm"
          />
          <button
            type="button"
            onClick={createTag}
            disabled={!newTagName.trim()}
            className="p-2 rounded-lg bg-orange-500/80 text-white hover:bg-orange-500 disabled:opacity-50 transition-colors"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setIsCreating(false);
              setNewTagName('');
            }}
            className="p-2 rounded-lg bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {tags.length === 0 && !isCreating && (
        <p className="text-xs text-muted-foreground text-center py-2">
          Registre como você está durante a pausa para análise de bem-estar
        </p>
      )}
    </div>
  );
}