import { useEffect, useState } from 'react'
import TopBar from './components/TopBar'
import Sidebar from './components/Sidebar'
import CanvasEditor from './components/CanvasEditor'
import PropertiesPanel from './components/PropertiesPanel'
import ExportDialog from './components/ExportDialog'
import PrintDialog from './components/PrintDialog'
import { waitForFonts } from './lib/fonts'
import { useEditor } from './store/useEditor'

export default function App() {
  const [dialog, setDialog] = useState<'export' | 'print' | null>(null)
  const [fontsReady, setFontsReady] = useState(false)

  useEffect(() => {
    waitForFonts().finally(() => setFontsReady(true))
  }, [])

  // Re-render the active document once fonts arrive so text is measured with the right metrics.
  const setZoom = useEditor((s) => s.setZoom)
  useEffect(() => {
    if (fontsReady) setZoom('fit')
  }, [fontsReady, setZoom])

  return (
    <div className={`app ${fontsReady ? 'fonts-ready' : ''}`}>
      <TopBar onExport={() => setDialog('export')} onPrint={() => setDialog('print')} />
      <div className="workspace">
        <Sidebar />
        <CanvasEditor key={fontsReady ? 'ready' : 'loading'} />
        <PropertiesPanel />
      </div>
      {dialog === 'export' && <ExportDialog onClose={() => setDialog(null)} />}
      {dialog === 'print' && <PrintDialog onClose={() => setDialog(null)} />}
    </div>
  )
}
