export const usePathname = () => '/';
export const useRouter = () => ({push: href => window.location.assign(href),refresh:()=>window.location.reload()});
