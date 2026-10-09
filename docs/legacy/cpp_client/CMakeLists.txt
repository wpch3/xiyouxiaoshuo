cmake_minimum_required(VERSION 3.20)
project(AITokenPetNative LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_definitions(-DUNICODE -D_UNICODE)

include_directories(include)

add_executable(AITokenPetNative WIN32
    src/main.cpp
)

target_link_libraries(AITokenPetNative
    User32
    Shell32
    Ole32
    OleAut32
    AdvAPI32
)
