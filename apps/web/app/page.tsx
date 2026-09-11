"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {

  const router = useRouter();


  const [role, setRole] = useState("ADMIN");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");



  const handleLogin = () => {


    setError("");



    // ADMIN LOGIN

    if (
      role === "ADMIN" &&
      email === "admin@neurolpx.com" &&
      password === "Admin@123!"
    ) {

      router.push("/assessments");

      return;

    }




    // LEARNER LOGIN

    if (
      role === "LEARNER" &&
      email === "learner@gmail.com" &&
      password === "Learner@123!"
    ) {

      router.push("/assessments/test");

      return;

    }



    setError("Invalid email or password");


  };



  return (

    <div className="min-h-screen flex items-center justify-center bg-zinc-100">


      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">


        <h1 className="text-3xl font-bold text-center mb-8">
          eLabs Login
        </h1>



        <div className="space-y-5">



          <div>

            <label className="block text-sm font-medium mb-2">
              Select Role
            </label>


            <select

              value={role}

              onChange={(e)=>setRole(e.target.value)}

              className="w-full rounded-lg border border-gray-300 px-4 py-3"

            >

              <option value="ADMIN">
                Admin
              </option>


              <option value="LEARNER">
                Learner
              </option>


            </select>


          </div>




          <div>

            <label className="block text-sm font-medium mb-2">
              Email
            </label>


            <input

              type="email"

              value={email}

              onChange={(e)=>setEmail(e.target.value)}

              placeholder="Enter email"

              className="w-full rounded-lg border border-gray-300 px-4 py-3"

            />


          </div>




          <div>

            <label className="block text-sm font-medium mb-2">
              Password
            </label>


            <input

              type="password"

              value={password}

              onChange={(e)=>setPassword(e.target.value)}

              placeholder="Enter password"

              className="w-full rounded-lg border border-gray-300 px-4 py-3"

            />


          </div>




          {
            error && (

              <p className="text-red-500 text-sm">
                {error}
              </p>

            )
          }




          <button

            onClick={handleLogin}

            className="w-full rounded-lg bg-black text-white py-3 font-semibold hover:bg-gray-800"

          >

            Sign In

          </button>



        </div>



      </div>



    </div>

  );

}