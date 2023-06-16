export default function Loading() {
    return (
        <div
            role="status"
            className="max-w-screen animate-pulse mx-auto flex flex-col justify-center items-center lg:flex-row"
        >
            <div className="h-[30vh] bg-gray-200 dark:bg-gray-700 w-[80vw] mb-4 mt-8 rounded-md lg:w-[20vw] lg:h-[80vh] lg:m-8"></div>
            <div className="bg-gray-200 mt-2 rounded-md h-[80vh] w-[70vw] lg:m-8"></div>
        </div>
    );
}
