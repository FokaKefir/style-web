import React, { useState } from 'react'
import { IoClose } from "react-icons/io5";

const Images = (props) => {
  const [popup, setPopup] = useState(false)
  const [popupData, setpopupData] = useState("")

  console.log(props);

  // Determine the image URL from props
  const imageUrl = props.url ?? null;
  return (
    <>
      {/* Popup box container */}
      <div className={`fixed left-1/2 ${popup ? "top-1/2 opacity-100 " : "top-[-150%] opacity-0 "
        } -translate-x-1/2 -translate-y-1/2 w-full h-full bg-slate-900 rounded-md flex justify-center items-center z-40 transition-all duration-300 ease-in-out`}> <IoClose
          className="w-16 h-16 text-white absolute right-0 top-0 z-50"
          onClick={() => {
            setPopup(false);
          }}
        />
        {/* Image shown on popup */}
        <img src={popupData} alt="popup" className="w-full sm:w-5/6 md:w-1/2" /></div>
      {/* image which display in gallery */}
      <img
        src={imageUrl}
        onClick={(e) => {
          setpopupData(e.target.src)
          setPopup(true)
        }}
        alt="gallery"
        className='w-full mb-2 rounded-xl hover:scale-110 shadow-2xl  hover:shadow-slate-900 transition' />
    </>
  )
}

export default Images