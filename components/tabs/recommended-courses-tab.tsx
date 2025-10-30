"use client"
import { useState } from "react"
import { Search, ExternalLink } from "lucide-react"

export default function RecommendedCoursesTab() {
  const [activeFilter, setActiveFilter] = useState("all")

  const courses = [
    {
      id: 1,
      title: "Основы FIRST",
      author: "Серик Серикбаев",
      difficulty: "Легкий",
      difficultyColor: "bg-green-500",
      popular: true,
      new: false,
      topics: 30,
      cost: "0Т",
      image: "/robotics-first-course.jpg",
    },
    {
      id: 2,
      title: "Робототехника",
      author: "Дмитрий Петров",
      difficulty: "Сложный",
      difficultyColor: "bg-red-500",
      popular: false,
      new: true,
      topics: 12,
      cost: "5000Т",
      image: "/advanced-robotics-course.jpg",
    },
    {
      id: 3,
      title: "WRO - BASIC",
      author: "S7 Robotics",
      difficulty: "Легкий",
      difficultyColor: "bg-green-500",
      popular: false,
      new: true,
      topics: 20,
      cost: "0Т",
      image: "/wro-basic-robotics.jpg",
    },
    {
      id: 4,
      title: "Arduino программирование",
      author: "Анна Иванова",
      difficulty: "Легкий",
      difficultyColor: "bg-green-500",
      popular: true,
      new: false,
      topics: 15,
      cost: "3000Т",
      image: "/arduino-programming-course.jpg",
    },
  ]

  const filteredCourses = courses.filter((course) => {
    if (activeFilter === "all") return true
    if (activeFilter === "new") return course.new
    if (activeFilter === "popular") return course.popular
    return true
  })

  return (
    <div className="flex-1 p-4 md:p-8 animate-slide-up">
      
      <div className="flex space-x-2 mb-8 overflow-x-auto">
        {[
          { id: "all", label: "Все" },
          { id: "new", label: "Новые" },
          { id: "popular", label: "Популярные" },
        ].map((filter, index) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap animate-slide-up ${
              activeFilter === filter.id
                ? "bg-[#00a3ff] text-white"
                : "bg-[#16161c] text-[#a0a0b0] hover:text-white hover:bg-[#636370]/10"
            }`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {filter.label}
          </button>
        ))}
      </div>

      
      <div className="mt-4 md:mt-0 mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#a0a0b0] w-4 h-4" />
          <input
            type="text"
            placeholder="Поиск"
            className="w-full bg-[#16161c] border border-[#636370]/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-[#a0a0b0] focus:outline-none focus:border-[#00a3ff] transition-colors"
          />
        </div>
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course, index) => (
          <div
            key={course.id}
            className="bg-[#16161c] rounded-lg border border-[#636370]/20 overflow-hidden hover:border-[#636370]/40 transition-all duration-300 cursor-pointer group animate-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            
            <div className="relative h-32 bg-gradient-to-br from-[#636370]/20 to-[#636370]/5">
              <img src={course.image || "/placeholder.svg"} alt={course.title} className="w-full h-full object-cover" />
              <div className="absolute top-3 right-3">
                <ExternalLink className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              
              <div className="absolute bottom-3 left-3">
                <span className={`${course.difficultyColor} text-white text-xs px-2 py-1 rounded-full font-medium`}>
                  {course.difficulty}
                </span>
              </div>
              
              {course.popular && (
                <div className="absolute top-3 left-3">
                  <span className="bg-[#00a3ff] text-white text-xs px-2 py-1 rounded-full font-medium">Популярное</span>
                </div>
              )}
              {course.new && (
                <div className="absolute top-3 left-3">
                  <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">Новое</span>
                </div>
              )}
            </div>

            
            <div className="p-4">
              <h3 className="text-white font-medium text-lg mb-2 group-hover:text-[#00a3ff] transition-colors">
                {course.title}
              </h3>
              <p className="text-[#a0a0b0] text-sm mb-3">Автор: {course.author}</p>
              <div className="flex justify-between items-center text-sm text-[#a0a0b0]">
                <span>Тем: {course.topics}</span>
                <span className="text-white font-medium">Стоимость: {course.cost}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      
      {filteredCourses.length === 0 && (
        <div className="text-center py-12 animate-slide-up">
          <div className="text-[#a0a0b0] text-lg mb-2">Курсов не найдено</div>
          <div className="text-[#636370] text-sm">Попробуйте изменить фильтры</div>
        </div>
      )}
    </div>
  )
}
