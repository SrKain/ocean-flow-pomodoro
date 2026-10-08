import { useState, useEffect } from 'react';
import { Plus, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagSelectorProps {
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  className?: string;
  compact?: boolean;
}

const defaultColors = [
  'hsl(200, 80%, 55%)',  // Ocean blue
  'hsl(160, 70%, 45%)',  // Teal
  'hsl(280, 65%, 55%)',  // Purple
  'hsl(340, 75%, 55%)',  // Pink
  'hsl(45, 85%, 55%)',   // Gold
  'hsl(15, 80%, 55%)',   // Orange
];

export function TagSelector({ selectedTags, onTagsChange, className, compact = false }: TagSelectorProps) {
  const [tags, setTags] = useState<Tag[]>([]);
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
      if (!isSupabaseConfigured || user.id.startsWith('local-')) {
        throw new Error('Local mode');
      }

      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', user.id)
        .eq('tag_type', 'focus')
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setTags(data.map(t => ({
          id: t.id,
          name: t.name,
          color: t.color || defaultColors[0]
        })));
        return;
      }
      throw new Error('No remote tags');
    } catch {
      const saved = localStorage.getItem('ocean_flow_tags_focus');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTags(parsed);
            return;
          }
        } catch {}
      }
      const initialTags: Tag[] = [
        { id: 'tag-1', name: 'Estudo', color: defaultColors[0] },
        { id: 'tag-2', name: 'Trabalho', color: defaultColors[1] },
        { id: 'tag-3', name: 'Leitura', color: defaultColors[2] },
      ];
      setTags(initialTags);
      localStorage.setItem('ocean_flow_tags_focus', JSON.stringify(initialTags));
    } finally {
      setLoading(false);
    }
  };

  const createTag = async () => {
    if (!newTagName.trim() || !user) return;
    
    const colorIndex = tags.length % defaultColors.length;
    const color = defaultColors[colorIndex];
    const name = newTagName.trim();

    try {
      if (!isSupabaseConfigured || user.id.startsWith('local-')) {
        throw new Error('Local mode');
      }

      const newTag = {
        user_id: user.id,
        name,
        color,
        tag_type: 'focus'
      };

      const { data, error } = await supabase
        .from('tags')
        .insert(newTag)
        .select()
        .single();

      if (error) throw error;
      
      const tag: Tag = {
        id: data.id,
        name: data.name,
        color: data.color || color
      };
      
      const updated = [...tags, tag];
      setTags(updated);
      localStorage.setItem('ocean_flow_tags_focus', JSON.stringify(updated));
      onTagsChange([...selectedTags, tag]);
      setNewTagName('');
      setIsCreating(false);
    } catch {
      const tag: Tag = {
        id: 'tag-' + Date.now(),
        name,
        color
      };
      const updated = [...tags, tag];
      setTags(updated);
      localStorage.setItem('ocean_flow_tags_focus', JSON.stringify(updated));
      onTagsChange([...selectedTags, tag]);
      setNewTagName('');
      setIsCreating(false);
    }
  };

  const toggleTag = (tag: Tag) => {
    const isSelected = selectedTags.some(t => t.id === tag.id);
    if (isSelected) {
      onTagsChange(selectedTags.filter(t => t.id !== tag.id));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const deleteTag = async (tagId: string) => {
    try {
      if (isSupabaseConfigured && !user?.id.startsWith('local-')) {
        await supabase
          .from('tags')
          .delete()
          .eq('id', tagId);
      }
    } catch (e) {
      console.error('Error deleting tag:', e);
    }
    const updated = tags.filter(t => t.id !== tagId);
    setTags(updated);
    localStorage.setItem('ocean_flow_tags_focus', JSON.stringify(updated));
    onTagsChange(selectedTags.filter(t => t.id !== tagId));
  };

  if (loading) {
    return (
      <div className={cn("animate-pulse h-12 bg-white/5 rounded-xl", className)} />
    );
  }

  return (
    <div className={cn(compact ? "space-y-2" : "space-y-3", className)}>
      {/* Selected/Available Tags */}
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
                backgroundColor: isSelected ? `${tag.color}30` : 'hsla(210, 40%, 20%, 0.4)',
                color: isSelected ? 'white' : 'hsl(200, 20%, 80%)'
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border border-dashed border-white/20 text-muted-foreground hover:border-primary/50 hover:text-primary"
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
            placeholder="Nome da tag"
            autoFocus
            className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 text-sm"
          />
          <button
            type="button"
            onClick={createTag}
            disabled={!newTagName.trim()}
            className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
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
          Crie tags para organizar suas sessões de foco
        </p>
      )}
    </div>
  );
}
