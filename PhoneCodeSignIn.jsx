import { useState, useEffect, useRef } from "react";
import axios from "axios";

import { useNavigate, useLocation, Link } from "react-router-dom";

import { TbHomeShield } from "react-icons/tb";

import "./PhoneCodeSignIn.css";

const PhoneCodeSignIn = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [inputIndex, setInputIndex] = useState(0);
  const location = useLocation();
  const { phoneNumber } = location.state || {};

  const [message, setMessage] = useState("");
  const [code, setCode] = useState(Array(6).fill(""));

  const navigate = useNavigate();
  const inputRefs = useRef([]); // Create an array of refs for each input element

  const goToNextInput = (e) => {
    const key = e.which || e.keyCode; // Get the key code from the event
    const target = e.target; // Get the event target (input element)
    let sib = target.nextElementSibling; // Get the next sibling element

    if (key === 37) {
      // Left arrow key
      if (inputIndex > 0) {
        inputRefs.current[inputIndex - 1].focus();
        inputRefs.current[inputIndex - 1].select();
        setInputIndex(inputIndex - 1);
      } else if (inputIndex === 0) {
        inputRefs.current[5].focus();
        inputRefs.current[5].select();
        setInputIndex(5);
      }
    }

    if (key === 39) {
      if (inputIndex >= 0 && inputIndex < 5) {
        inputRefs.current[inputIndex + 1].focus();
        inputRefs.current[inputIndex + 1].select();
        setInputIndex(inputIndex + 1);
      } else if (inputIndex === 5) {
        inputRefs.current[0].focus();
        inputRefs.current[0].select();
        setInputIndex(0);
      }
    }

    // Prevent non-digit keys and non-tab keys from doing anything
    if (key != 9 && (key < 48 || key > 57)) {
      e.preventDefault(); // Prevent the default action (typing in the box)
      return false;
    }

    // Allow the Tab key to do its default behaviour
    if (key === 9) {
      return true;
    }

    if (sib) {
      sib.focus();
      sib.select();
    }
  };

  const handleKeyDown = (e) => {
    let key = e.which || e.keyCode; // Better compatibility with browser differences
    if (key === 9 || (key >= 48 && key <= 57)) {
      return true;
    }
    e.preventDefault();
    return false;
  };

  const handleOnFocus = (e) => {
    e.target.select();
  };

  const handleChange = (index) => (event) => {
    event.preventDefault();
    event.stopPropagation();

    setInputIndex(index);

    const newCodeValues = [...code];
    newCodeValues[index] = event.target.value;
    setCode(newCodeValues);
  };

  const handleSubmit = async () => {
    const finalCode = code.join("");
    if (finalCode.length === 6) {
      try {
        const response = await axios.post(
          import.meta.env.VITE_SERVER_URL + "/user/verify-code",
          { phoneNumber, code: finalCode }
        );
        const { message, verified } = response.data;
        console.log(message);
        setMessage(message);

        if (verified) {
          localStorage.removeItem("sid");
          navigate("/signup/restaurant/business-info");
        }
      } catch (error) {
        if (error.response) {
          // The request was made and the server responded with a status code that falls out of the range of 2xx
          console.error("Error data:", error.response.data);
          console.error("Error status:", error.response.status);
          const { message } = error.response.data;
          setMessage(message);
        } else if (error.request) {
          // The request was made but no response was received
          console.error("Error request:", error.request);
        } else {
          console.error("Error", error.message);
        }
      }
    } else {
      setMessage("Please enter a valid 6-digit code.");
    }
  };

  if (isOpen) {
    document.body.style.overflow = "hidden";
  }

  const closeModal = () => {
    setIsOpen(false);
    document.body.style.overflow = "auto";
    navigate(-1);
  };

  const handleBackgroundClick = () => {
    closeModal();
  };

  const handleContentClick = (event) => {
    // Stop the click from propagating to the modalDiv
    event.stopPropagation();
  };

  const goBack = (e) => {
    e.preventDefault();
    navigate(-1);
  };

  const callPhoneVerification = async () => {
    try {
      const response = await axios.post(
        import.meta.env.VITE_SERVER_URL + "/user/verify-phone",
        { phoneNumber }
      );
      const { sid } = response.data;
      if (sid) {
        localStorage.setItem("sid", sid);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";

    // Focus the first input element when the component mounts
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <>
      <div className="phoneModalDiv" onClick={handleBackgroundClick}>
        <div className="phoneModal" onClick={handleContentClick}>
          {message && (
            <p className="text-[#ff2400] text-sm font-semibold">{message}</p>
          )}
          <div className="flex flex-col items-center gap-2">
            <TbHomeShield className="text-7xl" />
            <h2 className="text-gray-700 font-semibold text-xl">
              Enter Verification Code
            </h2>
            <p>A verification code has been sent to:</p>
            <p className="underline">+1***-***-{phoneNumber.slice(-4)}</p>
          </div>
          <div className="code-inputs flex justify-center items-center gap-2 mt-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <input
                key={i}
                type="text"
                maxLength="1"
                size="1"
                min="0"
                max="9"
                pattern="[0-9]{1}"
                onClick={handleOnFocus}
                onKeyUp={goToNextInput}
                onKeyDown={handleKeyDown}
                onChange={handleChange(i)}
                ref={(el) => inputRefs.current.push(el)}
              />
            ))}
          </div>
          <button
            className="mt-4 w-full bg-white border-black border py-2 px-4 rounded hover:bg-black hover:text-white focus:outline-none ease-in-out transition-colors duration-300   "
            onClick={handleSubmit}
          >
            Verify
          </button>
          <div className="flex justify-between">
            <p
              onClick={callPhoneVerification}
              className="text-blue-500 hover:underline cursor-pointer"
            >
              Resend Code
            </p>
            <Link
              to="#"
              onClick={goBack}
              className="text-blue-500 hover:underline"
            >
              Change Number
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default PhoneCodeSignIn;
