import { useState, useEffect } from 'react';
import { Edit2, Merge, Save, X, Trash2, FolderPlus, Folder } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Tag {
  id: string;
  name: string;
  color: string;
  group_id?: string | null;
}

interface TagGroup {
  id: string;
  name: string;
  color: string;
}

interface TagManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TagManagement({ isOpen, onClose }: TagManagementProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [groups, setGroups] = useState<TagGroup[]>([]);
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [mergeMode, setMergeMode] = useState(false);
  const [mergeName, setMergeName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showGroupCreate, setShowGroupCreate] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (user && isOpen) {
      loadData();
    }
  }, [user, isOpen]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Load tags
      const { data: tagsData, error: tagsError } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (tagsError) throw tagsError;

      // Load groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('tag_groups')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (groupsError) throw groupsError;

      setTags(tagsData?.map(t => ({
        id: t.id,
        name: t.name,
        color: t.color || 'hsl(200, 80%, 55%)',
        group_id: t.group_id,
      })) || []);

      setGroups(groupsData?.map(g => ({
        id: g.id,
        name: g.name,
        color: g.color || 'hsl(200, 80%, 55%)',
      })) || []);

    } catch (e) {
      console.error('Error loading data:', e);
      toast.error('Erro ao carregar tags');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (tag: Tag) => {
    setEditingTag(tag.id);
    setEditName(tag.name);
  };

  const saveEdit = async () => {
    if (!editingTag || !editName.trim()) return;

    try {
      // Update tag name
      const { error: tagError } = await supabase
        .from('tags')
        .update({ name: editName.trim() })
        .eq('id', editingTag);

      if (tagError) throw tagError;

      // Update all cycle_records that used the old tag name
      const oldTag = tags.find(t => t.id === editingTag);
      if (oldTag) {
        const { error: cycleError } = await supabase
          .from('cycle_records')
          .update({ tag: editName.trim() })
          .eq('tag', oldTag.name)
          .eq('user_id', user?.id);

        if (cycleError) console.error('Error updating cycles:', cycleError);
      }

      setTags(tags.map(t => 
        t.id === editingTag ? { ...t, name: editName.trim() } : t
      ));
      setEditingTag(null);
      toast.success('Tag renomeada!');
    } catch (e) {
      console.error('Error saving tag:', e);
      toast.error('Erro ao salvar tag');
    }
  };

  const toggleTagSelection = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(id => id !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  const startMerge = () => {
    if (selectedTags.length < 2) {
      toast.error('Selecione pelo menos 2 tags para mesclar');
      return;
    }
    setMergeMode(true);
    // Suggest first selected tag name
    const firstTag = tags.find(t => t.id === selectedTags[0]);
    setMergeName(firstTag?.name || '');
  };

  const executeMerge = async () => {
    if (!mergeName.trim() || selectedTags.length < 2) return;

    try {
      const selectedTagNames = tags
        .filter(t => selectedTags.includes(t.id))
        .map(t => t.name);

      // Update all cycle_records to use the new merged name
      for (const tagName of selectedTagNames) {
        const { error } = await supabase
          .from('cycle_records')
          .update({ tag: mergeName.trim() })
          .eq('tag', tagName)
          .eq('user_id', user?.id);

        if (error) console.error('Error updating cycles for', tagName, error);
      }

      // Keep the first tag with the new name, delete the rest
      const [keepId, ...deleteIds] = selectedTags;

      // Update the kept tag
      const { error: updateError } = await supabase
        .from('tags')
        .update({ name: mergeName.trim() })
        .eq('id', keepId);

      if (updateError) throw updateError;

      // Delete the other tags
      for (const id of deleteIds) {
        await supabase.from('tags').delete().eq('id', id);
      }

      // Update local state
      setTags(tags
        .filter(t => !deleteIds.includes(t.id))
        .map(t => t.id === keepId ? { ...t, name: mergeName.trim() } : t)
      );

      setSelectedTags([]);
      setMergeMode(false);
      setMergeName('');
      toast.success(`${selectedTagNames.length} tags mescladas em "${mergeName.trim()}"`);
    } catch (e) {
      console.error('Error merging tags:', e);
      toast.error('Erro ao mesclar tags');
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
      toast.success('Tag deletada');
    } catch (e) {
      console.error('Error deleting tag:', e);
      toast.error('Erro ao deletar tag');
    }
  };

  const createGroup = async () => {
    if (!newGroupName.trim() || !user) return;

    try {
      const { data, error } = await supabase
        .from('tag_groups')
        .insert({
          user_id: user.id,
          name: newGroupName.trim(),
          color: 'hsl(200, 80%, 55%)',
        })
        .select()
        .single();

      if (error) throw error;

      setGroups([...groups, {
        id: data.id,
        name: data.name,
        color: data.color || 'hsl(200, 80%, 55%)',
      }]);
      setNewGroupName('');
      setShowGroupCreate(false);
      toast.success('Grupo criado!');
    } catch (e) {
      console.error('Error creating group:', e);
      toast.error('Erro ao criar grupo');
    }
  };

  const assignTagToGroup = async (tagId: string, groupId: string | null) => {
    try {
      const { error } = await supabase
        .from('tags')
        .update({ group_id: groupId })
        .eq('id', tagId);

      if (error) throw error;

      setTags(tags.map(t => 
        t.id === tagId ? { ...t, group_id: groupId } : t
      ));
    } catch (e) {
      console.error('Error assigning tag to group:', e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-popup w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-foreground">Gerenciar Tags</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-foreground" />
          </button>
        </div>

        {/* Merge mode header */}
        {mergeMode && (
          <div className="p-4 bg-primary/10 border-b border-primary/20">
            <p className="text-sm text-foreground mb-3">
              Mesclar {selectedTags.length} tags em:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={mergeName}
                onChange={(e) => setMergeName(e.target.value)}
                placeholder="Nome da tag mesclada"
                className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-foreground text-sm focus:outline-none focus:border-primary/50"
              />
              <button
                onClick={executeMerge}
                disabled={!mergeName.trim()}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                Mesclar
              </button>
              <button
                onClick={() => {
                  setMergeMode(false);
                  setSelectedTags([]);
                }}
                className="px-4 py-2 rounded-lg bg-white/10 text-foreground text-sm hover:bg-white/20 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Actions bar */}
        {!mergeMode && selectedTags.length > 0 && (
          <div className="p-3 bg-white/5 border-b border-white/10 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedTags.length} selecionada{selectedTags.length > 1 ? 's' : ''}
            </span>
            <button
              onClick={startMerge}
              disabled={selectedTags.length < 2}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 text-primary text-sm hover:bg-primary/30 disabled:opacity-50 transition-colors"
            >
              <Merge className="w-4 h-4" />
              Mesclar
            </button>
            <button
              onClick={() => setSelectedTags([])}
              className="px-3 py-1.5 rounded-lg bg-white/10 text-foreground text-sm hover:bg-white/20 transition-colors"
            >
              Limpar
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando...
            </div>
          ) : (
            <div className="space-y-6">
              {/* Groups section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Folder className="w-4 h-4" />
                    Grupos de Tags
                  </h3>
                  <button
                    onClick={() => setShowGroupCreate(true)}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    Novo grupo
                  </button>
                </div>

                {showGroupCreate && (
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="Nome do grupo"
                      autoFocus
                      className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-foreground text-sm focus:outline-none focus:border-primary/50"
                    />
                    <button
                      onClick={createGroup}
                      disabled={!newGroupName.trim()}
                      className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setShowGroupCreate(false);
                        setNewGroupName('');
                      }}
                      className="p-2 rounded-lg bg-white/10 text-foreground hover:bg-white/20 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {groups.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {groups.map(group => (
                      <div
                        key={group.id}
                        className="px-3 py-1.5 rounded-full text-xs font-medium border border-white/20 bg-white/5 text-foreground"
                      >
                        {group.name}
                        <span className="ml-1.5 text-muted-foreground">
                          ({tags.filter(t => t.group_id === group.id).length})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tags list */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Todas as Tags ({tags.length})
                </h3>
                
                {tags.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma tag criada ainda
                  </p>
                ) : (
                  <div className="space-y-2">
                    {tags.map(tag => (
                      <div
                        key={tag.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl bg-white/5 border transition-all",
                          selectedTags.includes(tag.id)
                            ? "border-primary/50 bg-primary/10"
                            : "border-white/10 hover:border-white/20"
                        )}
                      >
                        {/* Selection checkbox */}
                        <button
                          onClick={() => toggleTagSelection(tag.id)}
                          className={cn(
                            "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                            selectedTags.includes(tag.id)
                              ? "border-primary bg-primary"
                              : "border-white/30 hover:border-white/50"
                          )}
                        >
                          {selectedTags.includes(tag.id) && (
                            <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </button>

                        {/* Color dot */}
                        <span 
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: tag.color }}
                        />

                        {/* Name */}
                        {editingTag === tag.id ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit();
                              if (e.key === 'Escape') setEditingTag(null);
                            }}
                            autoFocus
                            className="flex-1 px-2 py-1 rounded bg-white/10 border border-white/20 text-foreground text-sm focus:outline-none"
                          />
                        ) : (
                          <span className="flex-1 text-sm text-foreground">{tag.name}</span>
                        )}

                        {/* Group selector */}
                        {groups.length > 0 && (
                          <select
                            value={tag.group_id || ''}
                            onChange={(e) => assignTagToGroup(tag.id, e.target.value || null)}
                            className="px-2 py-1 rounded bg-white/10 border border-white/10 text-xs text-foreground focus:outline-none"
                          >
                            <option value="">Sem grupo</option>
                            {groups.map(g => (
                              <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                          </select>
                        )}

                        {/* Actions */}
                        {editingTag === tag.id ? (
                          <>
                            <button
                              onClick={saveEdit}
                              className="p-1.5 rounded bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingTag(null)}
                              className="p-1.5 rounded bg-white/10 text-foreground hover:bg-white/20 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(tag)}
                              className="p-1.5 rounded bg-white/10 text-muted-foreground hover:text-foreground hover:bg-white/20 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteTag(tag.id)}
                              className="p-1.5 rounded bg-white/10 text-muted-foreground hover:text-destructive hover:bg-destructive/20 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <p className="text-xs text-muted-foreground text-center">
            Alterações nas tags são aplicadas retroativamente aos relatórios
          </p>
        </div>
      </div>
    </div>
  );
}
