'use client'

import { NewStartup } from "@/db/schema"
import { useCurrentUser } from "@/hooks/useUser"
import { useForm, SubmitHandler } from "react-hook-form"
import { addNewStartup } from "@/Actions/startupAction"



const page = () => {

  const {email , isLoaded} = useCurrentUser()


 const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<NewStartup>()

  const onSubmit = async (data:NewStartup) => {

    if (!isLoaded && !email) return

    // console.log(data);

      const newData = { ...data, email } as NewStartup

      // console.log(newData);

     const addST = await addNewStartup(newData)

     console.log(addST);

      
    
  }


  return (
    <div>

          <form onSubmit={handleSubmit(onSubmit)}>

      <input {...register("name", { required: true })} placeholder="Name" className="border border-gray-300 rounded px-3 py-2 placeholder-gray-400 focus:outline-none focus:border-blue-500" />
      {errors.name && <span>This field is required</span>}

      <input {...register("img", { required: true })} placeholder="Image URL" className="border border-gray-300 rounded px-3 py-2 placeholder-gray-400 focus:outline-none focus:border-blue-500" />
      {errors.img && <span>This field is required</span>}

      <input {...register("description", { required: true })} placeholder="Description" className="border border-gray-300 rounded px-3 py-2 placeholder-gray-400 focus:outline-none focus:border-blue-500" />
      {errors.description && <span>This field is required</span>}

      <input type="number" {...register("singleFund", { required: true })} placeholder="Single Fund" className="border border-gray-300 rounded px-3 py-2 placeholder-gray-400 focus:outline-none focus:border-blue-500" />
      {errors.singleFund && <span>This field is required</span>}
      <input type="number" {...register("totalTarget", { required: true })} placeholder="Total Target" className="border border-gray-300 rounded px-3 py-2 placeholder-gray-400 focus:outline-none focus:border-blue-500" />
      {errors.totalTarget && <span>This field is required</span>}

      <input type="submit" />
    </form>

    </div>
  )
}

export default page
