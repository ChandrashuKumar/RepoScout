import { Handle, Position } from 'reactflow';
import { Folder, FileCode, FileJson, FileType, File, Database } from 'lucide-react'; // Import Database icon


const FolderNode = ({ data }: any) => {
    return (
        <div className="px-4 py-2 shadow-xl rounded-lg bg-slate-900 border-2 border-slate-700 min-w-[150px] flex items-center gap-3 transition-all hover:border-cyan-500/50">
       
            <Handle type="target" position={Position.Top} className="!bg-slate-500 !w-2 !h-2" />

            <div className="p-2 rounded bg-slate-800 text-yellow-500">
                <Folder size={16} />
            </div>
            <div className="flex flex-col">
                <span className="text-slate-200 text-sm font-semibold tracking-wide">{data.label}</span>
            </div>

         
            <Handle type="source" position={Position.Bottom} className="!bg-slate-500 !w-2 !h-2" />
        </div>
    );
};


const FileNode = ({ data }: any) => {

    const ext = data.label.split('.').pop();
    let Icon = File;
    let color = "text-slate-400";

    if (['ts', 'tsx', 'js', 'jsx'].includes(ext)) { Icon = FileCode; color = "text-blue-400"; }
    else if (['json', 'yml'].includes(ext)) { Icon = FileJson; color = "text-yellow-400"; }
    else if (['css', 'html'].includes(ext)) { Icon = FileType; color = "text-orange-400"; }

    const isHighlighted = data.highlighted;

    return (
        <div className={`px-3 py-2 shadow-md rounded-md bg-slate-950 min-w-[120px] flex items-center gap-2 transition-all group ${
            isHighlighted
                ? 'border-2 border-cyan-500 shadow-lg shadow-cyan-500/30 ring-2 ring-cyan-500/20'
                : 'border border-slate-800 hover:border-cyan-500/50'
        }`}>
            <Handle type="target" position={Position.Top} className="!bg-slate-600 !w-1.5 !h-1.5" />

            <Icon size={14} className={isHighlighted ? 'text-cyan-400' : color} />
            <span className={`text-xs font-mono transition-colors truncate max-w-[150px] ${
                isHighlighted ? 'text-cyan-300' : 'text-slate-400 group-hover:text-cyan-300'
            }`}>
                {data.label}
            </span>
        </div>
    );
};

const RootNode = ({ data }: any) => {
    return (
        <div className="px-6 py-3 shadow-2xl rounded-xl bg-slate-900 border-2 border-blue-500 min-w-[180px] flex items-center justify-center gap-3 shadow-blue-500/20">


            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                <Database size={20} />
            </div>
            <span className="text-white text-lg font-bold tracking-wide">
                {data.label}
            </span>


            <Handle type="source" position={Position.Bottom} className="!bg-blue-500 !w-3 !h-3" />
        </div>
    );
};


export const nodeTypes = {
    root: RootNode,
    folder: FolderNode,
    file: FileNode,
};