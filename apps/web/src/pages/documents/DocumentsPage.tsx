import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, UploadCloud, Trash2, Download, X, Search } from 'lucide-react';
import { format } from 'date-fns';
import { useDocuments, useCreateDocument, useDeleteDocument } from '../../hooks/useDocuments';
import { useAuth } from '../../auth/AuthContext';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import type { Document } from '../../types';

const REF_TYPES: Document['refType'][] = [
  'property', 'unit', 'lease', 'payment', 'maintenance', 'tenant',
];

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent';

function fileSizeLabel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function mimeIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return '🖼';
  if (mimeType === 'application/pdf') return '📄';
  return '📎';
}

export function DocumentsPage() {
  const { user } = useAuth();
  const { data: documents = [], isLoading } = useDocuments();
  const createMutation = useCreateDocument();
  const deleteMutation = useDeleteDocument();

  const [search,        setSearch]        = useState('');
  const [refTypeFilter, setRefTypeFilter] = useState<Document['refType'] | 'all'>('all');
  const [showForm,      setShowForm]      = useState(false);
  const [deletingId,    setDeletingId]    = useState<string | null>(null);

  // Register form state
  const [droppedFile, setDroppedFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    refType:  'lease' as Document['refType'],
    refId:    '',
    filePath: '',
  });

  const onDrop = useCallback((accepted: File[]) => {
    const file = accepted[0];
    if (!file) return;
    setDroppedFile(file);
    setForm((f) => ({ ...f, filePath: `/uploads/${file.name}` }));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'image/*':         ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'text/*':          ['.txt', '.csv'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
    },
  });

  const filtered = documents.filter((d) => {
    if (refTypeFilter !== 'all' && d.refType !== refTypeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return d.fileName.toLowerCase().includes(q) || d.refId.toLowerCase().includes(q);
    }
    return true;
  });

  function handleOpenForm() {
    setDroppedFile(null);
    setForm({ refType: 'lease', refId: '', filePath: '' });
    setShowForm(true);
  }

  async function handleRegister() {
    if (!droppedFile || !form.refId.trim() || !form.filePath.trim()) return;
    await createMutation.mutateAsync({
      refType:    form.refType,
      refId:      form.refId.trim(),
      fileName:   droppedFile.name,
      filePath:   form.filePath.trim(),
      fileSize:   droppedFile.size,
      mimeType:   droppedFile.type,
      uploadedBy: user!.id,
    });
    setShowForm(false);
  }

  const apiBase = import.meta.env.VITE_API_BASE_URL as string;

  if (isLoading) return <div className="text-gray-500 text-sm">Loading…</div>;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
        <button
          onClick={handleOpenForm}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-sm font-medium text-white transition-colors"
        >
          <UploadCloud size={16} /> Register Document
        </button>
      </div>

      {/* Register form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-primary-200 p-5 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <UploadCloud size={16} className="text-primary-500" /> Register Document
            </h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-4">
            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-primary-400 bg-primary-50'
                  : droppedFile
                    ? 'border-success-400 bg-success-50'
                    : 'border-gray-200 hover:border-primary-300'
              }`}
            >
              <input {...getInputProps()} />
              {droppedFile ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText size={20} className="text-success-500" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-800">{droppedFile.name}</p>
                    <p className="text-xs text-gray-400">{fileSizeLabel(droppedFile.size)} · {droppedFile.type}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setDroppedFile(null); }}
                    className="ml-2 text-gray-400 hover:text-danger-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <UploadCloud size={24} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    {isDragActive
                      ? 'Drop it here…'
                      : <>Drag &amp; drop a file, or <span className="text-primary-600 font-medium">browse</span></>}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PDF, images, Word documents, CSV</p>
                </>
              )}
            </div>

            {/* refType + refId */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Linked to</label>
                <select
                  value={form.refType}
                  onChange={(e) => setForm((f) => ({ ...f, refType: e.target.value as Document['refType'] }))}
                  className={inputClass}
                >
                  {REF_TYPES.map((t) => (
                    <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Record ID</label>
                <input
                  type="text"
                  value={form.refId}
                  onChange={(e) => setForm((f) => ({ ...f, refId: e.target.value }))}
                  placeholder="UUID of the linked record"
                  className={inputClass}
                />
              </div>
            </div>

            {/* filePath */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Server file path
              </label>
              <input
                type="text"
                value={form.filePath}
                onChange={(e) => setForm((f) => ({ ...f, filePath: e.target.value }))}
                placeholder="/uploads/filename.pdf"
                className={inputClass}
              />
              <p className="text-xs text-gray-400 mt-1">
                Upload the file to the server first, then enter its path here.
              </p>
            </div>

            <div className="flex gap-3 justify-end pt-1">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRegister}
                disabled={!droppedFile || !form.refId.trim() || !form.filePath.trim() || createMutation.isPending}
                className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-sm font-medium text-white transition-colors disabled:opacity-60"
              >
                {createMutation.isPending ? 'Registering…' : 'Register'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by file name or record ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputClass} pl-8`}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setRefTypeFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              refTypeFilter === 'all'
                ? 'bg-primary-500 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            All
          </button>
          {REF_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setRefTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                refTypeFilter === t
                  ? 'bg-primary-500 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Empty */}
      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <FileText size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">{search || refTypeFilter !== 'all' ? 'No documents match your filters' : 'No documents registered yet'}</p>
        </div>
      )}

      {/* Table */}
      {filtered.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">File</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Linked To</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Record ID</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Size</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Uploaded</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{mimeIcon(d.mimeType)}</span>
                      <div>
                        <p className="font-medium text-gray-900 truncate max-w-[200px]">{d.fileName}</p>
                        <p className="text-xs text-gray-400">{d.mimeType} {d.version > 1 ? `· v${d.version}` : ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-600">{d.refType}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                    {d.refId.slice(0, 8)}…
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-gray-500 text-xs">
                    {fileSizeLabel(Number(d.fileSize))}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {format(new Date(d.uploadedAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <a
                        href={`${apiBase}${d.filePath}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                        title="Download"
                      >
                        <Download size={14} />
                      </a>
                      <button
                        onClick={() => setDeletingId(d.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-danger-600 hover:bg-danger-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete confirm */}
      {deletingId && (
        <ConfirmDialog
          title="Delete document record?"
          description="This removes the document registration. The file on the server is not deleted."
          confirmLabel="Delete"
          onConfirm={() => deleteMutation.mutate(deletingId, { onSuccess: () => setDeletingId(null) })}
          onCancel={() => setDeletingId(null)}
          loading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
