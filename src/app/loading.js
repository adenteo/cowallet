export default function Loading() {
    // You can add any UI inside Loading, including a Skeleton.
    console.log("LOADING");
    return (
        <div
            role="status"
            className="w-[80vw] animate-pulse flex justify-center items-center mx-auto my-auto"
        >
            <div className="h-[50vh] w-[80vw] lg:w-[30vw] bg-gray-200 rounded-md dark:bg-gray-700 mt-40"></div>
        </div>
    );
}
