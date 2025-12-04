import { useExport } from './useExport';
import { FileDown, LayoutTemplate, Settings, AlertCircle } from 'lucide-react';
import { browser } from 'wxt/browser';

export default function App() {
    const { exportMarkdown, isExporting, error } = useExport();

    const openDashboard = () => {
        browser.runtime.openOptionsPage(); // 或是 browser.tabs.create({ url: ... })
    };

    return (
        <div className="font-sans text-slate-800">
            {/* Header */}
            <div className="bg-white p-4 border-b border-slate-200 flex items-center justify-between">
                <h1 className="font-bold text-lg flex items-center gap-2">
                    <LayoutTemplate className="w-5 h-5 text-purple-600" />
                    Slides Tools
                </h1>
                <button 
                    onClick={() => browser.runtime.sendMessage({ type: 'OPEN_DASHBOARD' })}
                    className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-purple-600 transition-colors"
                    title="Manage Dashboard"
                >
                    <Settings className="w-4 h-4" />
                </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                
                {/* 狀態顯示 */}
                {/* <div className="text-xs text-slate-500 bg-slate-100 p-3 rounded-lg border border-slate-200">
                   當前功能僅在 Slides 簡報頁面有效。
                </div> */}

                {/* 匯出按鈕區 */}
                <div className="space-y-2">
                    <h2 className="text-sm font-semibold text-slate-700">Actions</h2>
                    
                    <button
                        onClick={exportMarkdown}
                        disabled={isExporting}
                        className="w-full flex items-center justify-center gap-3 bg-white hover:bg-purple-50  text-slate-700 font-medium py-3 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        {isExporting ? (
                            <div className="w-5 h-5 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                        ) : (
                            <div className="p-1.5 bg-purple-100 text-purple-600 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                <FileDown className="w-4 h-4" />
                            </div>
                        )}
                        <span>匯出為 Markdown</span>
                    </button>
                </div>

                {/* 錯誤訊息 */}
                {error && (
                    <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg flex items-start gap-2 border border-red-100 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        {error}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-[10px] text-center text-slate-400">
                WXT Extension v0.1.0
            </div>
        </div>
    );
}