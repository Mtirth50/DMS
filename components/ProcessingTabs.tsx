// components/DiamondProcessingTabs.tsx

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { NungSeparationForm } from "./forms/Nungseprationform"
import GalaxyScanningForm from "./forms/Galaxyscaningform"
import { ShineForm } from "./forms/ShineForm"
import Planningform from "./forms/Planningform"
import LssoingForm from "./forms/LssoingForm"
import ActiForm from "./forms/ActipartForm"
import HptpForm from "./forms/HptpForm"
import ProcessingForm from "./forms/ProcessingForm"
import FourpForm from "./forms/fourpForm"

const tabs = [
  { id: "nung", label: "નંગ સેપરેશન" },
  { id: "galaxy", label: "ગેલેક્સી સ્કેનિંગ" },
  { id: "planning", label: "પ્લાનિંગ" },
  { id: "shine", label: "શાઇન" },
  { id: "ls-soing", label: "એલએસ સોઈંગ" },
  { id: "acti-part", label: "એક્ટી પાર્ટ" },
  { id: "four-p", label: "4P" },
  { id: "hpht", label: "HPHT પ્રોસેસ" },
  { id: "polishing", label: "પોલિશિંગ" },
]

export const DiamondProcessingTabs = () => {
  const [activeTab, setActiveTab] = useState("nung")

  const renderTabContent = () => {
    switch (activeTab) {
      case "nung":
        return <NungSeparationForm/>
      case "galaxy":
        return <GalaxyScanningForm/>
      case "planning":
        return <Planningform/>
      case "shine":
        return <ShineForm/>
      case "ls-soing":
        return <LssoingForm/>
      case "acti-part":
        return <ActiForm/>
      case "four-p":
        return <FourpForm/>
      case "hpht":
        return <HptpForm/>
      case "polishing":
        return <ProcessingForm/>
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">ડાયમંડ પ્રોસેસિંગ</h2>
        </div>

        {/* Tabs Navigation */}
        <div className="flex flex-wrap gap-2 border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`px-4 py-2 rounded-t-md font-medium ${
                activeTab === tab.id
                  ? "bg-white border-t border-x border-b-0 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Tab Content */}
      <Card className="p-6">
        {renderTabContent()}
      </Card>
    </div>
  )
}
